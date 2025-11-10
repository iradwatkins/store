"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// Step 1: Store Details
const step1Schema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  tagline: z.string().max(100, "Tagline must be 100 characters or less").optional(),
  description: z.string().min(50, "Description must be at least 50 characters").optional(),
})

// Step 2: Contact & Shipping
const step2Schema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  country: z.string().min(2, "Country is required"),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

export default function CreateStorePage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state for each step
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/create-store")
    }
  }, [status, router])

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data || {},
  })

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data || {},
  })

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const handleStep2Submit = (data: Step2Data) => {
    setStep2Data(data)
    setCurrentStep(3)
  }

  const handleFinalSubmit = async (skipStripe: boolean = false) => {
    if (!step1Data || !step2Data) {
      setError("Please complete all steps")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/vendor/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: step1Data.name,
          slug: step1Data.slug,
          tagline: step1Data.tagline,
          description: step1Data.description,
          email: step2Data.email,
          phone: step2Data.phone,
          shipFromAddress: {
            address: step2Data.address,
            city: step2Data.city,
            state: step2Data.state,
            zipCode: step2Data.zipCode,
            country: step2Data.country,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create store")
      }

      // Update session to reflect new STORE_OWNER role
      await update()

      // Small delay to ensure session propagates
      await new Promise(resolve => setTimeout(resolve, 500))

      // If user chose to skip Stripe setup, go directly to success page
      if (skipStripe) {
        window.location.href = "/store-created?setup=skipped"
      } else if (result.stripeOnboardingUrl) {
        // Redirect to Stripe Connect onboarding
        window.location.href = result.stripeOnboardingUrl
      } else {
        // Fallback to success page
        window.location.href = "/store-created"
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // Don't render form if not authenticated (will redirect)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 w-32 mx-2 ${
                      currentStep > step ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Store Details</span>
            <span>Contact & Shipping</span>
            <span>Payment Setup</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Store Details */}
          {currentStep === 1 && (
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Store Details</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Store Name *
                </label>
                <input
                  {...step1Form.register("name")}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Chicago Steppin Boutique"
                />
                {step1Form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {step1Form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Store URL *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    stores.stepperslife.com/
                  </span>
                  <input
                    {...step1Form.register("slug")}
                    type="text"
                    className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="chicago-boutique"
                  />
                </div>
                {step1Form.formState.errors.slug && (
                  <p className="mt-1 text-sm text-red-600">
                    {step1Form.formState.errors.slug.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="tagline" className="block text-sm font-medium text-gray-700">
                  Tagline (Optional)
                </label>
                <input
                  {...step1Form.register("tagline")}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Premium Steppin Apparel & Accessories"
                  maxLength={100}
                />
                {step1Form.formState.errors.tagline && (
                  <p className="mt-1 text-sm text-red-600">
                    {step1Form.formState.errors.tagline.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  {...step1Form.register("description")}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Tell customers about your store..."
                />
                {step1Form.formState.errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {step1Form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Contact & Shipping */}
          {currentStep === 2 && (
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Contact & Shipping</h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Store Email *
                  </label>
                  <input
                    {...step2Form.register("email")}
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {step2Form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {step2Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number (Optional)
                  </label>
                  <input
                    {...step2Form.register("phone")}
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {step2Form.formState.errors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {step2Form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Shipping Address *
                  </label>
                  <input
                    {...step2Form.register("address")}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {step2Form.formState.errors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {step2Form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <input
                    {...step2Form.register("city")}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {step2Form.formState.errors.city && (
                    <p className="mt-1 text-sm text-red-600">
                      {step2Form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State *
                  </label>
                  <input
                    {...step2Form.register("state")}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {step2Form.formState.errors.state && (
                    <p className="mt-1 text-sm text-red-600">
                      {step2Form.formState.errors.state.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    Zip Code *
                  </label>
                  <input
                    {...step2Form.register("zipCode")}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {step2Form.formState.errors.zipCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {step2Form.formState.errors.zipCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <input
                    {...step2Form.register("country")}
                    type="text"
                    defaultValue="United States"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {step2Form.formState.errors.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {step2Form.formState.errors.country.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Payment Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Payment Setup (Optional)</h2>

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>You can set up payments now or later.</strong> Your store will be created immediately, and you can add products anytime. Payment setup is only required when you&apos;re ready to start selling.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">If you set up now, you&apos;ll need:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Business information (Tax ID, EIN, or SSN)</li>
                  <li>Bank account details for payouts</li>
                  <li>Personal identification</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h4 className="text-sm font-semibold text-green-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>1. Your store is created immediately</li>
                  <li>2. You can add products right away</li>
                  <li>3. Complete payment setup before your first sale</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 order-3 sm:order-1"
                  disabled={isLoading}
                >
                  Back
                </button>
                <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(true)}
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating store..." : "Skip for Now - Add Products First"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(false)}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating store..." : "Create Store & Setup Payments Now"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
