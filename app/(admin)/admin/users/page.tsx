import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export default async function AdminUsersPage() {
  const session = await auth()

  // Protect admin page
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  // Fetch all users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor_stores: {
        select: { name: true, slug: true },
      },
      _count: {
        select: { store_orders: true },
      },
    },
  })

  const roleStats = {
    ADMIN: users.filter(u => u.role === "ADMIN").length,
    STORE_OWNER: users.filter(u => u.role === "STORE_OWNER").length,
    USER: users.filter(u => u.role === "USER").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
              <p className="text-gray-600">Manage platform users</p>
            </div>
            <Link href="/admin" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Admins</h3>
            <div className="text-3xl font-bold">{roleStats.ADMIN}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Store Owners</h3>
            <div className="text-3xl font-bold">{roleStats.STORE_OWNER}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Customers</h3>
            <div className="text-3xl font-bold">{roleStats.USER}</div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Users ({users.length})</h3>
            <p className="text-sm text-gray-600">All registered users on the platform</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg">{user.name || "No name"}</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                        user.role === "STORE_OWNER" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Email: {user.email}
                    </p>
                    {user.image && (
                      <p className="text-sm text-gray-500 mb-1">
                        Has profile image
                      </p>
                    )}
                    {user.vendor_stores.length > 0 && (
                      <p className="text-sm text-gray-600 mb-1">
                        Store: <Link href={`/${user.vendor_stores[0].slug}`} className="text-blue-600 hover:underline">
                          {user.vendor_stores[0].name}
                        </Link>
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mb-1">
                      {user._count.store_orders} orders placed
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      ID: {user.id}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined: {new Date(user.createdAt).toLocaleDateString()} •
                      Last updated: {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
