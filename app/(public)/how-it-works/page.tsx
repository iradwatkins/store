"use client"

import Link from "next/link"
import { Store, ShoppingCart, CreditCard, TrendingUp, Package, Users } from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-green-600">
              Steppers Life
            </Link>
            <div className="flex gap-4">
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/for-sellers"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                For Sellers
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">How Steppers Life Works</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A simple, powerful marketplace platform that helps you launch and grow your online
            store in minutes. No technical skills required.
          </p>
        </div>
      </div>

      {/* For Sellers Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">For Sellers</h2>
          <p className="text-xl text-gray-600">
            Launch your online store in 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="text-green-600" size={40} />
            </div>
            <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              1
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Create Your Store</h3>
            <p className="text-gray-600">
              Sign up and customize your store with your brand colors, logo, and subdomain. Takes
              less than 5 minutes.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="text-blue-600" size={40} />
            </div>
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              2
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Add Products</h3>
            <p className="text-gray-600">
              Upload your products with photos, descriptions, prices, and variants. Organize them
              into categories.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="text-purple-600" size={40} />
            </div>
            <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              3
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Setup Payments</h3>
            <p className="text-gray-600">
              Connect Stripe, PayPal, Square, or accept cash. We support multiple payment methods
              for your customers.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="text-orange-600" size={40} />
            </div>
            <div className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              4
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Start Selling</h3>
            <p className="text-gray-600">
              Share your store link, manage orders, fulfill shipments, and track your sales with
              built-in analytics.
            </p>
          </div>
        </div>
      </div>

      {/* For Customers Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">For Customers</h2>
            <p className="text-xl text-gray-600">
              Shop from trusted sellers in the Steppers Life community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Store className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Discover Unique Stores</h3>
              <p className="text-gray-600">
                Browse products from independent sellers and brands you love. Each store has its own
                personality and style.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <ShoppingCart className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Checkout</h3>
              <p className="text-gray-600">
                Add items to your cart and checkout securely with multiple payment options including
                cards, PayPal, and more.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Track Your Orders</h3>
              <p className="text-gray-600">
                Get real-time order updates, tracking numbers, and leave reviews to help other
                shoppers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-xl text-gray-600">
            Powerful features to run your business
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Custom Subdomain</h3>
              <p className="text-gray-600">
                Get your own branded URL like yourstore.stepperslife.com instantly.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Multiple Payment Options</h3>
              <p className="text-gray-600">
                Accept Stripe, PayPal, Square, and cash payments to give customers flexibility.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics & Reports</h3>
              <p className="text-gray-600">
                Track sales, revenue, and customer behavior with detailed analytics dashboards.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Product Reviews</h3>
              <p className="text-gray-600">
                Build trust with verified purchase reviews and ratings from real customers.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inventory Management</h3>
              <p className="text-gray-600">
                Track stock levels, get low stock alerts, and manage product variants effortlessly.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Order Fulfillment</h3>
              <p className="text-gray-600">
                Manage orders, print shipping labels, and update tracking numbers in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Transparency Section */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transparent Pricing</h2>
            <p className="text-xl text-gray-600">
              Know exactly what you'll pay. No hidden fees.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Platform Fees</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Trial: 7% on transactions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Starter: 5% on transactions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Pro: 3% on transactions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Enterprise: 2% on transactions</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Stripe: 2.9% + $0.30</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>PayPal: 2.9% + $0.30</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Square: 2.6% + $0.10</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Cash: No fees</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Example: $100 Sale</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Sale Amount:</span>
                  <span className="font-semibold">$100.00</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Stripe Fee (2.9% + $0.30):</span>
                  <span>-$3.20</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Platform Fee (5% on Starter):</span>
                  <span>-$5.00</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-green-600">
                  <span>Your Payout:</span>
                  <span>$91.80</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-green-100 mb-8">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/onboard"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
            >
              Create Your Store
            </Link>
            <Link
              href="/pricing"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4">Steppers Life</h4>
              <p className="text-gray-400 text-sm">
                Build your online store and reach customers worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/for-sellers" className="hover:text-white">
                    For Sellers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="mailto:support@stepperslife.com" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Steppers Life. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}
