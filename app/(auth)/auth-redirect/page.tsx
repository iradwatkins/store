import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function AuthRedirectPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  const session = await auth()

  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect("/login")
  }

  // If there's a specific callback URL (not just "/"), use it
  const callbackUrl = searchParams.callbackUrl
  if (callbackUrl && callbackUrl !== "/" && callbackUrl !== "/auth-redirect") {
    redirect(callbackUrl)
  }

  // Smart routing based on user role and vendor store
  const user = session.user

  // Admins go to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/admin")
  }

  // Vendors go to vendor dashboard
  if (user.vendorStore) {
    redirect("/dashboard")
  }

  // Regular customers go to account page
  redirect("/account")
}
