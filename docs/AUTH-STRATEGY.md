# Authentication Strategy - NextAuth Implementation

**Project**: stores.stepperslife.com
**Auth Provider**: NextAuth.js v5 (Auth.js)
**Database**: PostgreSQL (shared with stepperslife.com)
**Version**: 1.0

---

## Overview

SteppersLife Stores uses **NextAuth.js v5** for authentication, **NOT** Clerk, Supabase, or any third-party auth provider.

### Key Decisions:
- ✅ **NextAuth v5** (latest, supports App Router)
- ✅ **Database sessions** (PostgreSQL, shared with main site)
- ✅ **SSO with stepperslife.com** (shared user table)
- ✅ **Email + Password** (primary method)
- ✅ **OAuth providers** (Google, optional Facebook)
- ❌ **NO Clerk.com**
- ❌ **NO Supabase Auth**
- ❌ **NO Vercel Auth**

---

## Database Schema (NextAuth Tables)

### Shared with stepperslife.com

```prisma
// User model (shared across stepperslife.com and stores.stepperslife.com)
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Hashed with bcrypt

  // Role for stores (if vendor)
  role          UserRole  @default(CUSTOMER)

  // Relations
  accounts      Account[]
  sessions      Session[]
  stores        Store[]   // If role = VENDOR or ADMIN

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

enum UserRole {
  CUSTOMER
  VENDOR
  ADMIN
}

// NextAuth Account model (OAuth connections)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

// NextAuth Session model
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// Email verification tokens
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

---

## NextAuth Configuration

### auth.ts (Root config)

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database", // Database sessions (shared across subdomains)
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/error",
  },
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role; // Add role to session
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // Send welcome email
      console.log("New user created:", user.email);
    },
  },
});
```

---

## API Routes

### app/api/auth/[...nextauth]/route.ts

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

---

## Authentication Flows

### 1. User Registration (Vendor)

```typescript
// app/auth/register/action.ts
"use server";

import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function registerVendor(data: {
  name: string;
  email: string;
  password: string;
}) {
  // Check if user exists
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await hash(data.password, 12);

  // Create user with VENDOR role
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "VENDOR",
    },
  });

  // Send verification email
  await sendVerificationEmail(user.email);

  return { success: true, userId: user.id };
}
```

### 2. Login Flow

```typescript
// app/auth/login/action.ts
"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function login(credentials: {
  email: string;
  password: string;
}) {
  try {
    await signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}
```

### 3. Checking Authentication

```typescript
// Middleware (middleware.ts)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Protect vendor dashboard routes
  if (nextUrl.pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/login", nextUrl));
    }

    // Check if user is vendor
    if (req.auth.user.role !== "VENDOR" && req.auth.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 4. Using Auth in Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### 5. Using Auth in Client Components

```typescript
"use client";

import { useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <a href="/auth/login">Login</a>;
  }

  return (
    <div>
      <p>{session.user.email}</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

---

## SSO with stepperslife.com

### Shared Session Strategy

1. **Same Database**: Both sites use same PostgreSQL database
2. **Same Session Table**: `sessions` table is shared
3. **Same Cookie Domain**: Set cookie domain to `.stepperslife.com`

### NextAuth Configuration for SSO:

```typescript
// Both stepperslife.com and stores.stepperslife.com
export const { auth } = NextAuth({
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: ".stepperslife.com", // Shared across subdomains
        secure: true,
      },
    },
  },
  // ... rest of config
});
```

### How SSO Works:

1. User logs in on **stepperslife.com**
2. Session cookie is set with domain `.stepperslife.com`
3. User visits **stores.stepperslife.com**
4. NextAuth reads session cookie (same domain)
5. User is automatically logged in ✅

---

## Environment Variables

```bash
# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3008"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Database (shared with main site)
DATABASE_URL="postgresql://user:password@localhost:5407/stepperslife_shared?schema=public"
```

---

## Security Best Practices

### Password Hashing
```typescript
import { hash, compare } from "bcryptjs";

// Hash password (on registration)
const hashedPassword = await hash(password, 12);

// Verify password (on login)
const isValid = await compare(password, user.password);
```

### CSRF Protection
- NextAuth handles CSRF automatically
- Uses signed cookies

### Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
});

// Usage in API route
const { success } = await ratelimit.limit(ip);
if (!success) {
  return new Response("Too many requests", { status: 429 });
}
```

---

## Migration from Clerk (If Applicable)

If you previously had Clerk references:

### 1. Update User Model
```prisma
// Remove Clerk-specific fields
model Store {
  // Before:
  ownerClerkId  String   @unique

  // After:
  ownerId       String   // Just the user ID
  owner         User     @relation(fields: [ownerId], references: [id])
}
```

### 2. Update Middleware
```typescript
// Before (Clerk):
import { authMiddleware } from "@clerk/nextjs";

// After (NextAuth):
import { auth } from "@/lib/auth";
```

### 3. Update Client Components
```typescript
// Before (Clerk):
import { useUser } from "@clerk/nextjs";
const { user } = useUser();

// After (NextAuth):
import { useSession } from "next-auth/react";
const { data: session } = useSession();
const user = session?.user;
```

---

## Testing Authentication

```bash
# Test registration
curl -X POST http://localhost:3008/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3008/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test protected route
curl http://localhost:3008/api/dashboard \
  -H "Cookie: next-auth.session-token=..."
```

---

## Summary

### What We Use:
- ✅ **NextAuth v5** for authentication
- ✅ **PostgreSQL** for user storage (shared with main site)
- ✅ **Database sessions** (not JWT)
- ✅ **Email/Password** + Google OAuth
- ✅ **SSO** across stepperslife.com domains
- ✅ **MinIO** for file storage (self-hosted)

### What We DON'T Use:
- ❌ Clerk.com
- ❌ Supabase Auth
- ❌ Vercel Auth
- ❌ Firebase Auth
- ❌ Any third-party auth SaaS

---

**This authentication strategy is production-ready and fully integrated with the SteppersLife ecosystem.**
