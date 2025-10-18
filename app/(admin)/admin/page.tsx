import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import Link from "next/link"

export default async function AdminPage() {
  const session = await auth()

  // Protect admin page - only ADMIN role can access
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  // Fetch platform statistics
  const [
    totalUsers,
    totalStores,
    activeStores,
    totalProducts,
    totalOrders,
    pendingOrders,
    totalRevenue,
    recentStores,
    recentUsers,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vendorStore.count(),
    prisma.vendorStore.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.storeOrder.count(),
    prisma.storeOrder.count({ where: { status: "PENDING" } }),
    prisma.storeOrder.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID"] } },
    }),
    prisma.vendorStore.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: { name: true, email: true },
        },
        _count: {
          select: { Product: true, StoreOrder: true },
        },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.storeOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        vendorStore: {
          select: { name: true, slug: true },
        },
        customer: {
          select: { name: true, email: true },
        },
      },
    }),
  ])

  const revenue = Number(totalRevenue._sum.total || 0)
  const platformFee = revenue * 0.07 // 7% platform fee

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Admin</h1>
              <p className="text-gray-600">Welcome back, {session.user.name || session.user.email}</p>
            </div>
            <Link href="/" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Stores</h3>
            <div className="text-3xl font-bold">{totalStores}</div>
            <p className="text-sm text-gray-500 mt-1">{activeStores} active</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Products</h3>
            <div className="text-3xl font-bold">{totalProducts}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-sm text-gray-500 mt-1">{pendingOrders} pending</p>
          </div>
        </div>

        {/* Revenue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-sm text-gray-600 mb-4">Total gross merchandise value</p>
            <div className="text-3xl font-bold">${revenue.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Platform Fees (7%)</h3>
            <p className="text-sm text-gray-600 mb-4">Your platform earnings</p>
            <div className="text-3xl font-bold text-green-600">${platformFee.toFixed(2)}</div>
          </div>
        </div>

        {/* Admin Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Admin Tools</h3>
            <p className="text-sm text-gray-600">Quick access to platform management</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/stores"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-gray-900">Manage Stores</h4>
                  <p className="text-xs text-gray-500">View, edit, and delete stores</p>
                </div>
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-gray-900">Manage Users</h4>
                  <p className="text-xs text-gray-500">View and manage user accounts</p>
                </div>
              </Link>

              <Link
                href="/admin/orders"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-gray-900">View Orders</h4>
                  <p className="text-xs text-gray-500">Monitor all platform orders</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Stores */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Stores</h3>
            <p className="text-sm text-gray-600">Latest vendor stores created</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <Link href={`/${store.slug}`} className="font-semibold text-blue-600 hover:underline">
                      {store.name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Owner: {store.User.name || store.User.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {store._count.Product} products • {store._count.StoreOrder} orders
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {store.isActive ? "Active" : "Inactive"}
                    </span>
                    <Link href={`/admin/stores/${store.id}`} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/stores" className="block w-full px-4 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50">
                View All Stores
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <p className="text-sm text-gray-600">Latest user registrations</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-semibold">{user.name || "No name"}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/users" className="block w-full px-4 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50">
                View All Users
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <p className="text-sm text-gray-600">Latest orders across all stores</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-semibold">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      Store: <Link href={`/${order.vendorStore.slug}`} className="text-blue-600 hover:underline">
                        {order.vendorStore.name}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500">
                      Customer: {order.customer?.name || order.customer?.email || order.customerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      order.status === "PAID" ? "bg-green-100 text-green-800" :
                      order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                      order.status === "REFUNDED" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                    <p className="font-semibold">${Number(order.total).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/orders" className="block w-full px-4 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50">
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
