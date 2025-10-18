"use client"

import Link from "next/link"
import { CheckCircle } from "lucide-react"

const PLANS = [
  {
    id: "TRIAL",
    name: "Trial",
    price: 0,
    period: "14 days free",
    description: "Perfect for testing the platform",
    features: [
      "10 products",
      "20 orders per month",
      "500MB storage",
      "Basic analytics",
      "Email support",
      "7% platform fee",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    id: "STARTER",
    name: "Starter",
    price: 29,
    period: "per month",
    description: "Best for new businesses",
    features: [
      "50 products",
      "100 orders per month",
      "1GB storage",
      "Advanced analytics",
      "Priority email support",
      "5% platform fee",
      "Custom domain support",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 79,
    period: "per month",
    description: "For growing businesses",
    features: [
      "500 products",
      "1,000 orders per month",
      "10GB storage",
      "Premium analytics & reports",
      "Priority support + phone",
      "3% platform fee",
      "Custom domain + SSL",
      "Marketing tools",
    ],
    cta: "Go Pro",
    highlighted: false,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 299,
    period: "per month",
    description: "For established brands",
    features: [
      "Unlimited products",
      "Unlimited orders",
      "100GB storage",
      "Custom analytics dashboard",
      "Dedicated account manager",
      "2% platform fee",
      "White-label options",
      "API access",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-green-600">
              Steppers Life
            </Link>
            <div className="flex gap-4">
              <Link
                href="/how-it-works"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                How It Works
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Start selling today with flexible plans that grow with your business. No hidden fees,
          cancel anytime.
        </p>
        <div className="flex justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                plan.highlighted
                  ? "ring-4 ring-green-600 transform scale-105"
                  : "border border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === "TRIAL" ? "/onboard" : "/onboard"}
                className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition ${
                  plan.highlighted
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Processing Fees Section */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Payment Processing Fees
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8">
            <p className="text-gray-700 mb-6 text-center">
              In addition to your subscription plan, payment processors charge transaction fees:
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-purple-600 font-bold text-lg mb-2">Stripe</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">2.9%</div>
                  <div className="text-gray-600">+ $0.30 per transaction</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-blue-600 font-bold text-lg mb-2">PayPal</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">2.9%</div>
                  <div className="text-gray-600">+ $0.30 per transaction</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-green-600 font-bold text-lg mb-2">Square</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">2.6%</div>
                  <div className="text-gray-600">+ $0.10 per transaction</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-gray-600 font-bold text-lg mb-2">Cash</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">0%</div>
                  <div className="text-gray-600">No processing fees</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mt-6">
              * Platform fees vary by plan. Payment processor fees are collected by the respective
              payment providers.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Can I change plans later?
            </h3>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the
              start of your next billing cycle.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-600">
              We accept all major credit cards through Stripe. Enterprise customers can also pay via
              invoice.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Is there a setup fee?
            </h3>
            <p className="text-gray-600">
              No setup fees! You only pay your monthly subscription and applicable platform fees on
              sales.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What happens after my trial ends?
            </h3>
            <p className="text-gray-600">
              After your 14-day trial, you can choose a paid plan to continue. Your store data is
              saved for 30 days if you decide not to upgrade.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start selling?</h2>
          <p className="text-xl text-green-100 mb-8">
            Join hundreds of sellers already using Steppers Life Marketplace
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/onboard"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="/how-it-works"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition"
            >
              Learn More
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
