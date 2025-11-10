import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/db"

export default async function StoreSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Await params since they're now async in Next.js 15
  const resolvedParams = await params
  
  // Check if this slug exists as a store
  const store = await prisma.vendor_stores.findUnique({
    where: { slug: resolvedParams.slug },
    select: { slug: true },
  })

  // If store exists, redirect to proper store route
  if (store) {
    redirect(`/store/${resolvedParams.slug}`)
  }

  // Otherwise, show 404
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Store not found</p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
