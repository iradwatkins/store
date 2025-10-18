import Link from "next/link"
import prisma from "@/lib/db"
import { Suspense } from "react"

export const dynamic = 'force-dynamic'

async function StoresGrid() {
  const stores = await prisma.vendorStore.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          Product: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      },
    },
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {stores.map((store) => (
        <Link
          key={store.id}
          href={`/store/${store.slug}`}
          className="group block"
        >
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            {store.logoUrl ? (
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {store.name}
              </h3>
              {store.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {store.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{store._count.Product} Products</span>
                {store.totalOrders > 0 && (
                  <span>{store.totalOrders} Orders</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Stores</h1>
        <p className="text-gray-600 mb-8">Browse our collection of independent vendors</p>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-64 skeleton animate-pulse" />
            ))}
          </div>
        }>
          <StoresGrid />
        </Suspense>
      </div>
    </div>
  )
}
