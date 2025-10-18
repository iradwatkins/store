"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ErrorProvider } from "@/components/error-provider"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorProvider>
      <NextAuthSessionProvider>
        {children}
      </NextAuthSessionProvider>
    </ErrorProvider>
  )
}
