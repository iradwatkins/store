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
  adapter: PrismaAdapter(prisma) as any,

  session: {
    strategy: "database",
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
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
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
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role

        // Check if user has a vendor store
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

        token.vendorStore = vendorStore
      }

      // Handle session updates - refresh vendorStore data
      if (trigger === "update") {
        if (token.id) {
          // Re-fetch vendor store data on session update
          const vendorStore = await prisma.vendorStore.findFirst({
            where: {
              userId: token.id as string,
            },
            select: {
              id: true,
              slug: true,
              name: true,
            },
          })
          token.vendorStore = vendorStore
        }

        if (session) {
          token = { ...token, ...session }
        }
      }

      return token
    },

    async session({ session, token, user }) {
      // With database strategy, we get 'user' from the database
      // We need to fetch fresh data every time to ensure role and vendorStore are current
      if (user?.id || token?.id) {
        const userId = (user?.id || token?.id) as string

        // Fetch fresh user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
            email: true,
            name: true,
          },
        })

        // Fetch vendor store if exists
        const vendorStore = await prisma.vendorStore.findFirst({
          where: { userId },
          select: {
            id: true,
            slug: true,
            name: true,
          },
        })

        if (dbUser && session.user) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role
          session.user.vendorStore = vendorStore
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
