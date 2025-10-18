import { redirect } from "next/navigation"

export default function RegisterPage() {
  // Redirect to login page since they're functionally the same
  redirect("/login")
}
