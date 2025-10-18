"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

function StoreCreatedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [storeData, setStoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const setupSkipped = searchParams.get("setup") === "skipped"
  const onboardingComplete = searchParams.get("onboarding") === "complete"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      // Fetch store data
      fetch("/api/vendor/stores")
        .then((res) => res.json())
        .then((data) => {
          if (data.store) {
            setStoreData(data.store)
          }
        })
        .catch((err) => {
          console.error("Failed to fetch store:", err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [status, router])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your store...</p>
        </div>
      </div>
    )
  }

  if (!session || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Store not found. Please try creating your store again.</p>
          <Link
            href="/create-store"
            className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Congratulations! Your Store is Live!
          </h1>
          <p className="text-xl text-gray-600">
            {storeData.name} is ready to go
          </p>
        </div>

        {/* Store URL Banner */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Store URL</p>
              <p className="text-lg font-semibold text-blue-500">
                stores.stepperslife.com/{storeData.slug}
              </p>
            </div>
            <Link
              href={`/store/${storeData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 text-sm font-medium"
            >
              Preview Store
            </Link>
          </div>
        </div>

        {/* Conditional message based on setup status */}
        {setupSkipped && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Payment setup skipped.</strong> You can add products now and complete payment setup later from your dashboard settings. Payment processing is only required when you're ready to start selling.
                </p>
              </div>
            </div>
          </div>
        )}

        {onboardingComplete && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  <strong>Payment setup complete!</strong> Your Stripe account is being verified. You can start adding products now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What's Next Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h2>

          <div className="space-y-6">
            {/* Step 1: Add Products */}
            <div className="flex items-start p-5 border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:border-blue-300 transition-all">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-lg">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Add Your First Product
                </h3>
                <p className="text-gray-600 mb-4">
                  Start listing products in your store. Add photos, descriptions, prices, and inventory details.
                </p>
                <Link
                  href="/dashboard/products/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Product Now
                </Link>
              </div>
            </div>

            {/* Step 2: Setup Payments (if skipped) */}
            {setupSkipped && (
              <div className="flex items-start p-5 border-2 border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 hover:border-green-300 transition-all">
                <div className="flex-shrink-0 mr-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white font-bold text-lg">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Complete Payment Setup (Optional)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Stripe account to accept payments and receive payouts. You can do this anytime before your first sale.
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Setup Payments Later
                  </Link>
                </div>
              </div>
            )}

            {/* Step 3: Customize Store */}
            <div className="flex items-start p-5 border-2 border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:border-purple-300 transition-all">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg">
                  {setupSkipped ? "3" : "2"}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Customize Your Store
                </h3>
                <p className="text-gray-600 mb-4">
                  Update your store details, add a logo, customize your tagline, and make it yours.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Go to Settings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-md text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Go to Dashboard
            </Link>
            <Link
              href={`/store/${storeData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-md text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View Store
            </Link>
            <Link
              href="/account"
              className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-md text-gray-700 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              My Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StoreCreatedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <StoreCreatedContent />
    </Suspense>
  )
}
