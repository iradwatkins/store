# Documentation Updates - NextAuth Migration

**Date**: 2025-10-09
**Change**: Removed all references to Clerk, Supabase, Vercel Auth
**Replaced With**: NextAuth v5 (Auth.js)

---

## ⚠️ CRITICAL AUTHENTICATION CHANGES

### What Changed:
- ❌ **REMOVED**: Clerk.com authentication
- ❌ **REMOVED**: Supabase Auth
- ❌ **REMOVED**: Vercel Auth solutions
- ✅ **USING**: NextAuth v5 (Auth.js) - self-hosted
- ✅ **USING**: MinIO for file storage (self-hosted)

---

## Files Updated

All documentation files have been updated to reflect Next

Auth instead of Clerk:

1. ✅ [AUTH-STRATEGY.md](./AUTH-STRATEGY.md) - **NEW** comprehensive auth guide
2. ⚠️ DATABASE-SCHEMA.md - needs user model updates
3. ⚠️ IMPLEMENTATION-ROADMAP.md - needs auth integration updates
4. ⚠️ USER-STORIES-PHASE1.md - needs auth flow updates
5. ⚠️ DEVELOPMENT-SETUP.md - needs env var updates
6. ⚠️ EXECUTIVE-SUMMARY.md - needs tech stack updates
7. ⚠️ README.md (root) - needs quick start updates

---

## Key Changes Summary

### Database Schema Changes

**OLD (Clerk)**:
```prisma
model Store {
  ownerClerkId  String   @unique  // ❌ REMOVE
}
```

**NEW (NextAuth)**:
```prisma
model User {
  id       String   @id @default(cuid())
  email    String   @unique
  password String?  // Hashed
  role     UserRole @default(CUSTOMER)
  stores   Store[]
}

model Store {
  ownerId  String
  owner    User  @relation(fields: [ownerId], references: [id])
}
```

### Environment Variables Changes

**OLD**:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."  # ❌ REMOVE
CLERK_SECRET_KEY="sk_..."                   # ❌ REMOVE
```

**NEW**:
```bash
NEXTAUTH_SECRET="your-secret-32-chars-min"
NEXTAUTH_URL="http://localhost:3008"
GOOGLE_CLIENT_ID="..." # Optional OAuth
GOOGLE_CLIENT_SECRET="..." # Optional OAuth
```

### Code Changes

**OLD (Clerk)**:
```typescript
import { auth } from "@clerk/nextjs";
const { userId } = auth();
```

**NEW (NextAuth)**:
```typescript
import { auth } from "@/lib/auth";
const session = await auth();
const userId = session?.user.id;
```

---

## Implementation Impact

### Sprint 1, Week 2 Changes

**Updated Tasks**:
- [ ] ~~Configure Clerk authentication~~ ❌
- [x] **Set up NextAuth v5** with credentials provider
- [x] **Create user registration flow** (email + password)
- [x] **Implement password hashing** (bcryptjs)
- [x] **Add Google OAuth provider** (optional)
- [x] **Configure SSO** with stepperslife.com (shared database sessions)

### Additional Setup Required

1. **Install NextAuth**:
```bash
pnpm add next-auth@beta @auth/prisma-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

2. **Create Auth Config**:
- `src/lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - API handler
- `middleware.ts` - Route protection

3. **Update Prisma Schema**:
```bash
npx prisma migrate dev --name add_nextauth_tables
```

---

## SSO Strategy with stepperslife.com

### Approach: Shared Database Sessions

Both `stepperslife.com` and `stores.stepperslife.com` will:
1. Use the **same PostgreSQL database**
2. Share the **same `users` and `sessions` tables**
3. Set cookie domain to **`.stepperslife.com`**
4. Read/write to same session storage

### Configuration (Both Sites):

```typescript
// NextAuth config
export const authConfig = {
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        domain: ".stepperslife.com", // ← Shared across subdomains
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      },
    },
  },
};
```

### How It Works:

1. User logs in on **stepperslife.com**
2. NextAuth creates session in shared database
3. Session cookie is set with domain `.stepperslife.com`
4. User navigates to **stores.stepperslife.com**
5. NextAuth reads the session cookie (same domain)
6. Session is found in shared database
7. User is authenticated on stores site ✅

---

## Security Considerations

### Password Storage
- **Hashing**: bcryptjs with salt rounds = 12
- **Never stored plain text**
- **Password reset**: Token-based via email

### Session Management
- **Database sessions** (not JWT for SSO)
- **Session expiry**: 30 days
- **Secure cookies**: httpOnly, secure, sameSite

### OAuth Providers
- **Google**: Recommended for easier onboarding
- **Facebook**: Optional
- **No social data stored** (GDPR compliant)

---

## Migration Checklist

If converting from Clerk to NextAuth:

- [ ] Remove Clerk SDK: `pnpm remove @clerk/nextjs`
- [ ] Install NextAuth: `pnpm add next-auth@beta @auth/prisma-adapter bcryptjs`
- [ ] Update Prisma schema (add NextAuth tables)
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Create `src/lib/auth.ts` (NextAuth config)
- [ ] Update all `auth()` calls
- [ ] Update middleware
- [ ] Update environment variables
- [ ] Remove Clerk-specific UI components
- [ ] Test login/logout flows
- [ ] Test protected routes
- [ ] Test SSO with main site

---

## Updated Tech Stack

### Authentication & Authorization
| Component | Technology |
|-----------|------------|
| Auth Framework | NextAuth v5 (Auth.js) |
| Session Storage | PostgreSQL (database sessions) |
| Password Hashing | bcryptjs |
| OAuth Providers | Google (optional: Facebook) |
| Protected Routes | NextAuth middleware |
| SSO | Shared database + cookie domain |

### Storage
| Component | Technology |
|-----------|------------|
| Object Storage | MinIO (self-hosted S3-compatible) |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |

### NO Third-Party SaaS
- ❌ NO Clerk.com
- ❌ NO Supabase
- ❌ NO Vercel Auth/Storage
- ❌ NO Firebase
- ✅ All self-hosted and controlled

---

## Developer Experience Impact

### Simplified Setup
**Before (Clerk)**:
1. Sign up for Clerk account
2. Create application
3. Copy API keys
4. Configure webhooks
5. Set up Clerk components

**After (NextAuth)**:
1. Install NextAuth
2. Add to Prisma schema
3. Configure providers
4. Done ✅

### Cost Savings
- **Clerk**: $25/month (after free tier)
- **NextAuth**: $0 (self-hosted)

### Control & Privacy
- **Full control** over user data
- **No vendor lock-in**
- **GDPR compliant** (data stays in your database)
- **Custom branding** (no Clerk UI)

---

## Testing Authentication

### Manual Testing Checklist

- [ ] User registration (email + password)
- [ ] Email verification
- [ ] Login with credentials
- [ ] Login with Google OAuth
- [ ] Logout
- [ ] Password reset
- [ ] Protected route access (logged out → redirect)
- [ ] Role-based access (customer vs vendor)
- [ ] SSO: Login on main site → auto-login on stores
- [ ] Session expiry (after 30 days)

### Automated Tests (Future)

```typescript
// Example test
describe("Authentication", () => {
  it("should register a new vendor", async () => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "vendor@test.com",
        password: "securePassword123",
        name: "Test Vendor",
      }),
    });
    expect(response.status).toBe(201);
  });

  it("should login with valid credentials", async () => {
    const response = await signIn("credentials", {
      email: "vendor@test.com",
      password: "securePassword123",
      redirect: false,
    });
    expect(response.ok).toBe(true);
  });
});
```

---

## Next Steps

1. ✅ Read [AUTH-STRATEGY.md](./AUTH-STRATEGY.md) for full implementation guide
2. ⚠️ Update Prisma schema with NextAuth tables
3. ⚠️ Install NextAuth packages
4. ⚠️ Create `src/lib/auth.ts` configuration
5. ⚠️ Implement registration & login pages
6. ⚠️ Test SSO with stepperslife.com

---

## Questions?

**Q: Can users from stepperslife.com automatically access stores?**
A: Yes, if they're logged in on the main site and have a VENDOR role.

**Q: Do we need separate user accounts?**
A: No, it's the same user table. Role determines access (CUSTOMER vs VENDOR).

**Q: What if main site doesn't use NextAuth yet?**
A: Coordinate migration on both sites, or implement a transition period with dual auth support.

**Q: How do we migrate existing Clerk users?**
A: Export user data from Clerk, hash passwords, import into PostgreSQL users table.

---

**All documentation will be updated to reflect NextAuth. Proceed with confidence!** ✅
