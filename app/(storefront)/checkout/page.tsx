"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import ShippingInfoStep from "./ShippingInfoStep"
import ShippingMethodStep from "./ShippingMethodStep"
import PaymentStep from "./PaymentStep"
import CashPaymentStep from "./CashPaymentStep"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type CartItem = {
  cartItemId: string
  productId: string
  productName: string
  productSlug: string
  variantId: string | null
  variantName: string | null
  price: number
  quantity: number
  image: string | null
  storeSlug: string
}

type Cart = {
  items: CartItem[]
  storeSlug: string | null
}

type ShippingInfo = {
  email: string
  phone: string
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
}

type ShippingMethod = {
  id: string
  name: string
  price: number
  estimatedDays: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [cart, setCart] = useState<Cart>({ items: [], storeSlug: null })
  const [subtotal, setSubtotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [cartSessionId, setCartSessionId] = useState<string>("")
  const [acceptsCash, setAcceptsCash] = useState(false)
  const [cashInstructions, setCashInstructions] = useState<string>("")

  // Form state
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    email: "",
    phone: "",
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
  })

  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart")
      const data = await response.json()

      if (!data.cart || data.cart.items.length === 0) {
        router.push("/cart")
        return
      }

      setCart(data.cart)
      setSubtotal(data.total || 0)
      setCartSessionId(data.cartSessionId || "")

      // Fetch store settings to check if it accepts cash
      if (data.cart.storeSlug) {
        const storeResponse = await fetch(`/api/store-settings?slug=${data.cart.storeSlug}`)
        if (storeResponse.ok) {
          const storeData = await storeResponse.json()
          setAcceptsCash(storeData.acceptsCash || false)
          setCashInstructions(storeData.cashInstructions || "")
        }
      }
    } catch (error) {
      // P0 FIX: Don't log sensitive cart data
      router.push("/cart")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShippingInfoComplete = (info: ShippingInfo) => {
    setShippingInfo(info)
    setStep(2)
  }

  const handleShippingMethodComplete = (method: ShippingMethod) => {
    setSelectedShippingMethod(method)
    // If store accepts cash, skip Stripe and go to cash payment step
    if (acceptsCash) {
      setStep(3)
    } else {
      createPaymentIntent(method)
    }
  }

  const createPaymentIntent = async (shippingMethod: ShippingMethod) => {
    try {
      const response = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shippingInfo,
          shippingMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment intent")
      }

      setClientSecret(data.clientSecret)
      setStep(3)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create payment intent")
    }
  }

  const calculateTax = () => {
    // Simple tax calculation - 8.75% for Illinois (Chicago)
    const taxRate = 0.0875
    return (subtotal + (selectedShippingMethod?.price || 0)) * taxRate
  }

  const calculateTotal = () => {
    const shipping = selectedShippingMethod?.price || 0
    const tax = calculateTax()
    return subtotal + shipping + tax
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step >= num
                      ? "bg-blue-500 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      step > num ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-32 text-sm">
            <span className={step >= 1 ? "text-blue-500 font-medium" : "text-gray-400"}>
              Shipping
            </span>
            <span className={step >= 2 ? "text-blue-500 font-medium" : "text-gray-400"}>
              Method
            </span>
            <span className={step >= 3 ? "text-blue-500 font-medium" : "text-gray-400"}>
              Payment
            </span>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Main Content */}
          <div className="lg:col-span-7">
            {step === 1 && (
              <ShippingInfoStep
                initialData={shippingInfo}
                onComplete={handleShippingInfoComplete}
              />
            )}

            {step === 2 && (
              <ShippingMethodStep
                onComplete={handleShippingMethodComplete}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && acceptsCash && (
              <CashPaymentStep
                shippingInfo={shippingInfo}
                shippingMethod={selectedShippingMethod!}
                total={calculateTotal()}
                subtotal={subtotal}
                tax={calculateTax()}
                cartSessionId={cartSessionId}
                cashInstructions={cashInstructions}
                onBack={() => setStep(2)}
              />
            )}

            {step === 3 && !acceptsCash && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentStep
                  clientSecret={clientSecret}
                  shippingInfo={shippingInfo}
                  shippingMethod={selectedShippingMethod!}
                  onBack={() => setStep(2)}
                />
              </Elements>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="mb-4 space-y-3 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.cartItemId} className="flex items-start space-x-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                        <svg
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-gray-500">{item.variantName}</p>
                      )}
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-900">
                  <p>Subtotal</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>

                {selectedShippingMethod && (
                  <div className="flex justify-between text-sm text-gray-900">
                    <p>Shipping</p>
                    <p>${selectedShippingMethod.price.toFixed(2)}</p>
                  </div>
                )}

                {step >= 2 && selectedShippingMethod && (
                  <div className="flex justify-between text-sm text-gray-900">
                    <p>Tax</p>
                    <p>${calculateTax().toFixed(2)}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-medium text-gray-900">
                    <p>Total</p>
                    <p>${(step >= 2 && selectedShippingMethod ? calculateTotal() : subtotal).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
