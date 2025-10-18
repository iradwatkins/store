"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Analytics = {
  sales: {
    thirtyDays: number
    ninetyDays: number
    allTime: number
  }
  orders: {
    thirtyDays: number
    ninetyDays: number
    allTime: number
  }
  products: {
    active: number
    lowStock: number
  }
  topProducts: Array<{
    id: string
    name: string
    salesCount: number
    revenue: number
  }>
}

type DailySales = {
  date: string
  revenue: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [analyticsRes, dailySalesRes] = await Promise.all([
        fetch("/api/dashboard/analytics"),
        fetch("/api/dashboard/analytics/daily-sales"),
      ])

      if (analyticsRes.status === 401 || dailySalesRes.status === 401) {
        throw new Error("Session expired. Please log in again.")
      }

      if (analyticsRes.status === 404 || dailySalesRes.status === 404) {
        throw new Error("Vendor store not found. Please contact support.")
      }

      if (!analyticsRes.ok) {
        const errorData = await analyticsRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch analytics (${analyticsRes.status})`)
      }

      if (!dailySalesRes.ok) {
        const errorData = await dailySalesRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch sales data (${dailySalesRes.status})`)
      }

      const analyticsData = await analyticsRes.json()
      const dailySalesData = await dailySalesRes.json()

      setAnalytics(analyticsData)
      setDailySales(dailySalesData.dailySales)
      setError(null)
    } catch (err) {
      console.error("Analytics fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load analytics. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="mt-2 h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="mt-2 h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart and Top Products Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="ml-3 flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="mt-1 h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="ml-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">Track your store performance</p>
          </div>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <p className="mt-1 text-sm text-red-700">{error || "An unexpected error occurred"}</p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Track your store performance and insights</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Sales (30d)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.sales.thirtyDays)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                90d: {formatCurrency(analytics.sales.ninetyDays)}
              </p>
            </div>
            <div className="ml-4">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Orders (30d)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{analytics.orders.thirtyDays}</p>
              <p className="mt-1 text-xs text-gray-500">90d: {analytics.orders.ninetyDays}</p>
            </div>
            <div className="ml-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{analytics.products.active}</p>
              <p className="mt-1 text-xs text-gray-500">Listed on store</p>
            </div>
            <div className="ml-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <Link
          href="/dashboard/products?lowStock=true"
          className="bg-white rounded-lg shadow p-6 block hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {analytics.products.lowStock}
              </p>
              {analytics.products.lowStock > 0 && (
                <p className="mt-1 text-xs text-orange-600 font-medium flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Click to view products
                </p>
              )}
            </div>
            <div className="ml-4">
              <div className={`p-3 ${analytics.products.lowStock > 0 ? 'bg-orange-100' : 'bg-gray-100'} rounded-full`}>
                <svg
                  className={`h-6 w-6 ${analytics.products.lowStock > 0 ? 'text-orange-600' : 'text-gray-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          {dailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="mt-2">No sales data available yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
          {analytics.topProducts.length > 0 ? (
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-start">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.salesCount} sales</p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="mt-2 text-sm">No products sold yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/products"
            className="px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
          >
            Manage Products
          </Link>
          <Link
            href="/dashboard/orders"
            className="px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
          >
            View Orders
          </Link>
          <Link
            href="/dashboard/settings/shipping"
            className="px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
          >
            Shipping Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
