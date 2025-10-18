import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      email: string
      name?: string | null
      image?: string | null
      vendorStore?: {
        id: string
        slug: string
        name: string
      } | null
    }
  }

  interface User {
    id: string
    role: UserRole
    email: string
    name?: string | null
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    vendorStore?: {
      id: string
      slug: string
      name: string
    } | null
  }
}
