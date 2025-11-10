import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export default async function AdminOrdersPage() {
  const session = await auth()

  // Protect admin page
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  // Fetch all orders
  const orders = await prisma.store_orders.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor_stores: {
        select: { name: true, slug: true },
      },
      User: {
        select: { name: true, email: true },
      },
      store_order_items: {
        include: {
          products: {
            select: { name: true },
          },
        },
      },
    },
  })

  const statusStats = {
    pending: orders.filter(o => o.status === "PENDING").length,
    paid: orders.filter(o => o.status === "PAID").length,
    cancelled: orders.filter(o => o.status === "CANCELLED").length,
    refunded: orders.filter(o => o.status === "REFUNDED").length,
  }

  const totalRevenue = orders
    .filter(o => o.paymentStatus === "PAID")
    .reduce((sum, order) => sum + Number(order.total), 0)

  const platformFees = totalRevenue * 0.07

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
              <p className="text-gray-600">Platform-wide order management</p>
            </div>
            <Link href="/admin" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Pending</h3>
            <div className="text-2xl font-bold">{statusStats.pending}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Paid</h3>
            <div className="text-2xl font-bold">{statusStats.paid}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Cancelled</h3>
            <div className="text-2xl font-bold">{statusStats.cancelled}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Refunded</h3>
            <div className="text-2xl font-bold">{statusStats.refunded}</div>
          </div>
        </div>

        {/* Revenue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-sm text-gray-600 mb-4">Gross merchandise value</p>
            <div className="text-3xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Platform Fees (7%)</h3>
            <p className="text-sm text-gray-600 mb-4">Your earnings from orders</p>
            <div className="text-3xl font-bold text-green-600">${(platformFees / 100).toFixed(2)}</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Orders ({orders.length})</h3>
            <p className="text-sm text-gray-600">All orders across all stores</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg">Order #{order.orderNumber}</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        order.status === "PAID" ? "bg-green-100 text-green-800" :
                        order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                        order.status === "REFUNDED" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                      {order.paymentStatus === "PAID" && <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Paid</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Store: <Link href={`/${order.vendor_stores.slug}`} className="text-blue-600 hover:underline">
                        {order.vendor_stores.name}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Customer: {order.User?.name || order.User?.email || order.customerName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Shipping: {(order.shippingAddress as any).address}, {(order.shippingAddress as any).city}, {(order.shippingAddress as any).state} {(order.shippingAddress as any).zipCode}
                    </p>
                    <div className="text-sm text-gray-500 mb-1">
                      Items: {order.store_order_items.map(item =>
                        `${item.products.name} (${item.quantity}x)`
                      ).join(", ")}
                    </div>
                    {order.trackingNumber && (
                      <p className="text-sm text-gray-500 mb-1">
                        Tracking: {order.trackingNumber}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Order Date: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {order.paidAt && (
                      <p className="text-xs text-gray-400">
                        Paid: {new Date(order.paidAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">${Number(order.total).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Platform fee: ${Number(order.platformFee).toFixed(2)}
                      </p>
                    </div>
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
