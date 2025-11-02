import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import bcrypt from "bcryptjs"

export const authConfig = {
  // Prisma adapter for database sessions (required for magic links)
  adapter: PrismaAdapter(prisma) as any,

  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for production behind proxy

  session: {
    strategy: "database", // Database sessions for magic links and better security
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/onboarding",
  },

  // 🔥 SSO MAGIC - Cookie domain sharing (MUST match main site)
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        domain: '.stepperslife.com', // ← KEY: Enables SSO across all subdomains
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },

  providers: [
    // Email/Password login for testing
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing email or password')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              password: true
            }
          })

          if (!user || !user.password) {
            console.error('User not found or no password:', credentials.email)
            return null
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isValidPassword) {
            console.error('Invalid password for:', credentials.email)
            return null
          }

          console.log('Login successful for:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Error in authorize:', error)
          return null
        }
      }
    }),

    // Only include Google OAuth if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true, // Auto-link accounts with same email
          }),
        ]
      : []),

    // Only include Resend if API key is configured
    ...(process.env.RESEND_API_KEY
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM || "SteppersLife Stores <noreply@stepperslife.com>",
          }),
        ]
      : []),
  ],

  callbacks: {
    async session({ session, user }) {
      // With database strategy, we get user data from the database
      if (user && session.user) {
        session.user.id = user.id
        session.user.email = user.email
        session.user.name = user.name
        session.user.role = user.role || 'USER'

        // Fetch vendor store for the user
        try {
          const vendorStore = await prisma.vendorStore.findFirst({
            where: {
              userId: user.id,
            },
            select: {
              id: true,
              slug: true,
              name: true,
            },
          })
          session.user.vendorStore = vendorStore
        } catch (error) {
          console.error('Error fetching vendor store:', error)
          session.user.vendorStore = null
        }
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // If there's a specific relative callback URL, use it
      if (url.startsWith("/")) {
        // Don't intercept specific callback URLs
        return `${baseUrl}${url}`
      }

      // If URL is on same origin, use it
      if (new URL(url).origin === baseUrl) return url

      // Default: redirect to smart routing page
      return `${baseUrl}/auth-redirect`
    },

    async signIn({ user }) {
      // Auto-assign ADMIN role for platform administrators
      const adminEmails = ['iradwatkins@gmail.com', 'bobbygwatkins@gmail.com']
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        // Try to update existing user, but don't fail if user doesn't exist yet (new users)
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
          })
          user.role = 'ADMIN'
        } catch {
          // User doesn't exist yet - will be handled in events.signIn for new users
          logger.info("User not yet in DB, will set role after creation", { email: user.email })
        }
      }
      return true
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Assign ADMIN role for new admin users after they're created in DB
      if (isNewUser && user.email) {
        const adminEmails = ['iradwatkins@gmail.com', 'bobbygwatkins@gmail.com']
        if (adminEmails.includes(user.email.toLowerCase())) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'ADMIN' }
            })
            logger.info("New admin user registered", { email: user.email })
          } catch (error) {
            logger.error("Failed to set admin role for new user", error, { email: user.email })
          }
        }
      }

      logger.info("User signed in", { email: user.email, role: user.role })

      // Log audit trail for new users
      if (isNewUser) {
        logger.info("New user registered", {
          userId: user.id,
          email: user.email,
          provider: account?.provider,
          role: user.role,
        })
      }
    },

    async signOut(params) {
      logger.info("User signed out")

      // For database sessions, we rely on the adapter to handle cleanup
      // The session data in signOut event doesn't contain user info
      try {
        logger.info("Database session will be cleaned up by adapter")
      } catch (error) {
        logger.error("Error in signOut event", error)
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
} as NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
