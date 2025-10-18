"use client"

import Link from "next/link"
import {
  Store,
  DollarSign,
  TrendingUp,
  Shield,
  Smartphone,
  Zap,
  Users,
  Globe,
} from "lucide-react"

export default function ForSellersPage() {
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
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </Link>
              <Link
                href="/how-it-works"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                How It Works
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Start Selling Today</h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Launch your online store in minutes. No coding or technical skills required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/onboard"
                className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition inline-block"
              >
                Start Free Trial
              </Link>
              <Link
                href="#benefits"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition inline-block"
              >
                Learn More
              </Link>
            </div>
            <p className="mt-6 text-green-100">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Active Sellers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">$2M+</div>
              <div className="text-gray-600">Total Sales</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
              <div className="text-gray-600">Products Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Seller Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Sell With Us Section */}
      <div id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Sell on Steppers Life?</h2>
            <p className="text-xl text-gray-600">Everything you need to succeed online</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Setup</h3>
              <p className="text-gray-600">
                Launch your store in under 5 minutes. No technical knowledge required. We handle
                hosting, security, and updates.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <DollarSign className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Low Fees</h3>
              <p className="text-gray-600">
                Starting at just 2% platform fee for Enterprise plans. Keep more of what you earn
                compared to other marketplaces.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Store className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Your Brand</h3>
              <p className="text-gray-600">
                Get your own custom subdomain and brand your store with logos, colors, and your
                unique style.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-orange-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="text-orange-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Grow Sales</h3>
              <p className="text-gray-600">
                Access powerful analytics, marketing tools, and insights to help you grow your
                business faster.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-pink-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Shield className="text-pink-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                Accept payments through Stripe, PayPal, Square, or cash. All transactions are
                secure and encrypted.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Smartphone className="text-blue-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Friendly</h3>
              <p className="text-gray-600">
                Your store looks great on all devices. Manage orders and products from anywhere,
                anytime.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-yellow-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Built-in Audience</h3>
              <p className="text-gray-600">
                Tap into the Steppers Life community of shoppers looking for unique products from
                independent sellers.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Globe className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sell Anywhere</h3>
              <p className="text-gray-600">
                Reach customers across the country. We support multiple payment methods and shipping
                options.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Deep Dive */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features Included</h2>
            <p className="text-xl text-gray-600">Everything you need to run your business</p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Product Management</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Easily add, edit, and organize your products with our intuitive dashboard.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Unlimited product images and detailed descriptions
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Product variants (sizes, colors, styles)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">Inventory tracking and low stock alerts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">Bulk import and export tools</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <Store size={120} className="text-green-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Product Management Dashboard</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 h-96 flex items-center justify-center order-2 md:order-1">
                <div className="text-center">
                  <TrendingUp size={120} className="text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Analytics Dashboard</p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Analytics & Insights
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Make data-driven decisions with comprehensive analytics and reporting tools.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">Real-time sales tracking and revenue reports</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">Best-selling products and customer insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">Traffic and conversion rate metrics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">Export reports for accounting</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Compare with Other Platforms
            </h2>
            <p className="text-xl text-gray-600">See how we stack up</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Feature</th>
                  <th className="px-6 py-4 text-center">Steppers Life</th>
                  <th className="px-6 py-4 text-center">Etsy</th>
                  <th className="px-6 py-4 text-center">Shopify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">Monthly Fee</td>
                  <td className="px-6 py-4 text-center text-green-600 font-bold">$0 - $299</td>
                  <td className="px-6 py-4 text-center text-gray-600">$0</td>
                  <td className="px-6 py-4 text-center text-gray-600">$29 - $299</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Transaction Fee</td>
                  <td className="px-6 py-4 text-center text-green-600 font-bold">2% - 7%</td>
                  <td className="px-6 py-4 text-center text-gray-600">6.5%</td>
                  <td className="px-6 py-4 text-center text-gray-600">0% - 2%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Listing Fee</td>
                  <td className="px-6 py-4 text-center text-green-600 font-bold">$0</td>
                  <td className="px-6 py-4 text-center text-gray-600">$0.20/item</td>
                  <td className="px-6 py-4 text-center text-gray-600">$0</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Custom Domain</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Free Trial</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-bold">14 days</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">N/A</td>
                  <td className="px-6 py-4 text-center text-gray-600">3 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Seller Success Stories</h2>
            <p className="text-xl text-gray-600">
              Hear from sellers who are thriving on our platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600 font-bold text-xl mr-4">
                  JM
                </div>
                <div>
                  <div className="font-bold text-gray-900">Jordan Martinez</div>
                  <div className="text-sm text-gray-600">Handmade Jewelry</div>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4">
                "I went from $500/month to $5,000/month in just 6 months. The analytics tools
                helped me understand what my customers wanted."
              </p>
              <div className="flex text-yellow-400">★★★★★</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mr-4">
                  SK
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah Kim</div>
                  <div className="text-sm text-gray-600">Vintage Clothing</div>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4">
                "Setup was incredibly easy. I had my store live in 15 minutes and made my first
                sale the same day!"
              </p>
              <div className="flex text-yellow-400">★★★★★</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl mr-4">
                  MC
                </div>
                <div>
                  <div className="font-bold text-gray-900">Marcus Chen</div>
                  <div className="text-sm text-gray-600">Art Prints</div>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4">
                "The low fees mean I keep more of my profits. Plus, the customer support team is
                amazing and always there to help."
              </p>
              <div className="flex text-yellow-400">★★★★★</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Join Hundreds of Successful Sellers
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <Link
            href="/onboard"
            className="bg-white text-green-600 px-12 py-5 rounded-lg font-bold text-xl hover:bg-gray-100 transition inline-block"
          >
            Create Your Store Now
          </Link>
          <p className="mt-6 text-green-100">
            Questions? <a href="mailto:sales@stepperslife.com" className="underline font-semibold">Contact our sales team</a>
          </p>
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
