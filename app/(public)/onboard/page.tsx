"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

type Step = 1 | 2 | 3 | 4 | 5

interface OnboardingData {
  // Step 1: Business Info
  name: string
  slug: string
  industry: string

  // Step 2: Branding
  logoUrl?: string
  primaryColor: string

  // Step 3: Subscription
  subscriptionPlan: "TRIAL" | "STARTER" | "PRO" | "ENTERPRISE"

  // Step 4: Payment (handled by Stripe)
  // Step 5: Confirmation
}

const SUBSCRIPTION_PLANS = [
  {
    id: "TRIAL" as const,
    name: "Trial",
    price: 0,
    period: "14 days free",
    features: ["10 products", "20 orders/month", "0.5GB storage", "7% platform fee"],
    recommended: false,
  },
  {
    id: "STARTER" as const,
    name: "Starter",
    price: 29,
    period: "per month",
    features: ["50 products", "100 orders/month", "1GB storage", "5% platform fee"],
    recommended: true,
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: 79,
    period: "per month",
    features: ["500 products", "1,000 orders/month", "10GB storage", "3% platform fee"],
    recommended: false,
  },
  {
    id: "ENTERPRISE" as const,
    name: "Enterprise",
    price: 299,
    period: "per month",
    features: ["Unlimited products", "Unlimited orders", "100GB storage", "2% platform fee"],
    recommended: false,
  },
]

export default function OnboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    name: "",
    slug: "",
    industry: "",
    primaryColor: "#10b981",
    subscriptionPlan: "STARTER",
  })

  // Slug validation state
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugError, setSlugError] = useState<string>("")

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/onboard")
    }
  }, [status, router])

  // Check slug availability with debounce
  useEffect(() => {
    if (!data.slug || data.slug.length < 2) {
      setSlugAvailable(null)
      setSlugError("")
      return
    }

    const timeoutId = setTimeout(async () => {
      setSlugChecking(true)
      try {
        const response = await fetch(`/api/tenants/check-slug?slug=${data.slug}`)
        const result = await response.json()

        if (result.available) {
          setSlugAvailable(true)
          setSlugError("")
        } else {
          setSlugAvailable(false)
          setSlugError(result.error || "This subdomain is not available")
        }
      } catch (error) {
        setSlugError("Failed to check availability")
        setSlugAvailable(false)
      } finally {
        setSlugChecking(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [data.slug])

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const handleCreateTenant = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          subscriptionPlan: data.subscriptionPlan,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create tenant")
      }

      const { tenant } = await response.json()

      // If TRIAL, go straight to dashboard
      if (data.subscriptionPlan === "TRIAL") {
        setCurrentStep(5)
        setTimeout(() => {
          router.push(`/dashboard?tenant=${tenant.id}`)
        }, 2000)
      } else {
        // For paid plans, redirect to Stripe Checkout (Step 4)
        setCurrentStep(4)
        // TODO: Create Stripe Checkout session
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create tenant")
    } finally {
      setIsLoading(false)
    }
  }

  const isStep1Valid = data.name.length >= 2 && slugAvailable === true && data.industry !== ""
  const isStep2Valid = data.primaryColor.match(/^#[0-9A-Fa-f]{6}$/) !== null

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex-1">
                <div
                  className={`h-2 rounded-full ${
                    step <= currentStep ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={currentStep === 1 ? "font-semibold text-green-600" : "text-gray-500"}>
              Business
            </span>
            <span className={currentStep === 2 ? "font-semibold text-green-600" : "text-gray-500"}>
              Branding
            </span>
            <span className={currentStep === 3 ? "font-semibold text-green-600" : "text-gray-500"}>
              Plan
            </span>
            <span className={currentStep === 4 ? "font-semibold text-green-600" : "text-gray-500"}>
              Payment
            </span>
            <span className={currentStep === 5 ? "font-semibold text-green-600" : "text-gray-500"}>
              Done
            </span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Business Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Let's set up your store</h2>
                <p className="mt-2 text-gray-600">Tell us about your business</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                    setData({ ...data, name, slug })
                  }}
                  placeholder="Nike Store"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subdomain * <span className="text-gray-500 text-xs">(This will be your store URL)</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={data.slug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                      setData({ ...data, slug })
                    }}
                    placeholder="nike"
                    className={`flex-1 px-4 py-3 border rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      slugAvailable === true
                        ? "border-green-500"
                        : slugAvailable === false
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <span className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                    .stepperslife.com
                  </span>
                </div>
                {slugChecking && (
                  <p className="mt-2 text-sm text-gray-500">Checking availability...</p>
                )}
                {slugAvailable === true && !slugChecking && (
                  <p className="mt-2 text-sm text-green-600">✓ This subdomain is available!</p>
                )}
                {slugAvailable === false && !slugChecking && (
                  <p className="mt-2 text-sm text-red-600">✗ {slugError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                <select
                  value={data.industry}
                  onChange={(e) => setData({ ...data, industry: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select industry</option>
                  <option value="fashion">Fashion & Apparel</option>
                  <option value="shoes">Shoes & Footwear</option>
                  <option value="accessories">Accessories</option>
                  <option value="electronics">Electronics</option>
                  <option value="home">Home & Living</option>
                  <option value="beauty">Beauty & Cosmetics</option>
                  <option value="sports">Sports & Fitness</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Brand your store</h2>
                <p className="mt-2 text-gray-600">Customize how your store looks</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={data.logoUrl || ""}
                  onChange={(e) => setData({ ...data, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  You can upload a logo later in your dashboard
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={data.primaryColor}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    className="h-12 w-24 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.primaryColor}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    placeholder="#10b981"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  This color will be used for buttons, links, and highlights
                </p>
              </div>

              {/* Preview */}
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-4">Preview</p>
                <div className="space-y-3">
                  <button
                    style={{ backgroundColor: data.primaryColor }}
                    className="px-6 py-2 text-white rounded-lg font-medium"
                  >
                    Sample Button
                  </button>
                  <p className="text-gray-600">
                    Your store will use{" "}
                    <span style={{ color: data.primaryColor }} className="font-semibold">
                      this color
                    </span>{" "}
                    throughout
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Subscription Plan */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Choose your plan</h2>
                <p className="mt-2 text-gray-600">Start with a 14-day free trial, no credit card required</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setData({ ...data, subscriptionPlan: plan.id })}
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition ${
                      data.subscriptionPlan === plan.id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Recommended
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600 ml-1">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Payment (Placeholder for Stripe) */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center py-12">
              <div className="text-6xl">💳</div>
              <h2 className="text-3xl font-bold text-gray-900">Payment Setup</h2>
              <p className="text-gray-600">Stripe integration coming soon...</p>
              <p className="text-sm text-gray-500">For now, we'll create your tenant with the selected plan.</p>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center py-12">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900">You're all set!</h2>
              <p className="text-gray-600">
                Your store <span className="font-semibold">{data.name}</span> is ready
              </p>
              <p className="text-sm text-gray-500">
                Visit: <span className="font-mono text-green-600">https://{data.slug}.stepperslife.com</span>
              </p>
              <p className="text-sm text-gray-400">Redirecting to your dashboard...</p>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              {currentStep < 3 && (
                <button
                  onClick={handleNext}
                  disabled={currentStep === 1 ? !isStep1Valid : currentStep === 2 ? !isStep2Valid : false}
                  className={`ml-auto px-6 py-3 rounded-lg font-medium ${
                    (currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Next
                </button>
              )}
              {currentStep === 3 && (
                <button
                  onClick={handleCreateTenant}
                  disabled={isLoading}
                  className="ml-auto px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating..." : data.subscriptionPlan === "TRIAL" ? "Start Free Trial" : "Continue to Payment"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
