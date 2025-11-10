"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"

type AbandonedCart = {
  id: string
  customerEmail: string | null
  customerName: string | null
  cartTotal: number
  itemCount: number
  createdAt: string
  expiresAt: string
  reminderSentAt: string | null
  secondReminderSentAt: string | null
  thirdReminderSentAt: string | null
  isRecovered: boolean
  recoveredAt: string | null
  recoveryToken: string
  discountCode: string | null
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "recovered">("all")
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  useEffect(() => {
    fetchAbandonedCarts()
  }, [filter])

  const fetchAbandonedCarts = async () => {
    try {
      const response = await fetch(`/api/dashboard/abandoned-carts?filter=${filter}`)
      const data = await response.json()
      if (data.success) {
        setCarts(data.carts || [])
      }
    } catch (error) {
      console.error("Failed to fetch abandoned carts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendReminder = async (cartId: string) => {
    setSendingReminder(cartId)
    try {
      const response = await fetch(`/api/dashboard/abandoned-carts/${cartId}/send-reminder`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        alert("Reminder sent successfully!")
        fetchAbandonedCarts()
      } else {
        alert(data.message || "Failed to send reminder")
      }
    } catch (error) {
      console.error("Failed to send reminder:", error)
      alert("Failed to send reminder")
    } finally {
      setSendingReminder(null)
    }
  }

  const copyRecoveryLink = (token: string) => {
    const url = `${window.location.origin}/api/cart/recover?token=${token}`
    navigator.clipboard.writeText(url)
    alert("Recovery link copied to clipboard!")
  }

  const stats = {
    total: carts.length,
    withEmail: carts.filter(c => c.customerEmail).length,
    recovered: carts.filter(c => c.isRecovered).length,
    totalValue: carts.reduce((sum, c) => sum + c.cartTotal, 0),
    recoveredValue: carts.filter(c => c.isRecovered).reduce((sum, c) => sum + c.cartTotal, 0),
  }

  const recoveryRate = stats.total > 0 ? ((stats.recovered / stats.total) * 100).toFixed(1) : "0.0"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Abandoned Carts</h1>
          <p className="text-gray-600 mt-1">
            Track and recover abandoned shopping carts
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Carts</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">With Email</p>
          <p className="text-2xl font-bold text-blue-600">{stats.withEmail}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Recovered</p>
          <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Recovery Rate</p>
          <p className="text-2xl font-bold text-purple-600">{recoveryRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Recovered Value</p>
          <p className="text-2xl font-bold text-green-600">
            ${stats.recoveredValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Carts ({stats.total})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === "pending"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending ({stats.total - stats.recovered})
          </button>
          <button
            onClick={() => setFilter("recovered")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === "recovered"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Recovered ({stats.recovered})
          </button>
        </div>
      </div>

      {/* Carts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {carts.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No abandoned carts</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all"
                ? "No customers have abandoned their carts yet."
                : filter === "pending"
                ? "No pending abandoned carts."
                : "No recovered carts yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items / Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cart.customerName || "Guest"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cart.customerEmail || "No email"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ${cart.cartTotal.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(cart.createdAt), "MMM d, h:mm a")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(cart.expiresAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cart.isRecovered ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Recovered
                        </span>
                      ) : cart.thirdReminderSentAt ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          3rd Reminder Sent
                        </span>
                      ) : cart.secondReminderSentAt ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          2nd Reminder Sent
                        </span>
                      ) : cart.reminderSentAt ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          1st Reminder Sent
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {cart.customerEmail && !cart.isRecovered && (
                        <button
                          onClick={() => sendReminder(cart.id)}
                          disabled={sendingReminder === cart.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {sendingReminder === cart.id ? "Sending..." : "Send Reminder"}
                        </button>
                      )}
                      <button
                        onClick={() => copyRecoveryLink(cart.recoveryToken)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Copy Link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
