"use client"

import { useState } from "react"

type ShippingMethod = {
  id: string
  name: string
  price: number
  estimatedDays: string
}

type Props = {
  onComplete: (method: ShippingMethod) => void
  onBack: () => void
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 8.99,
    estimatedDays: "5-7 business days",
  },
  {
    id: "express",
    name: "Express Shipping",
    price: 15.99,
    estimatedDays: "2-3 business days",
  },
  {
    id: "local_pickup",
    name: "Local Pickup",
    price: 0,
    estimatedDays: "Available tomorrow",
  },
]

export default function ShippingMethodStep({ onComplete, onBack }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null)

  const handleContinue = () => {
    if (selectedMethod) {
      onComplete(selectedMethod)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Shipping Method</h2>

      <div className="space-y-4">
        {SHIPPING_METHODS.map((method) => (
          <div
            key={method.id}
            onClick={() => setSelectedMethod(method)}
            className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
              selectedMethod?.id === method.id
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  id={method.id}
                  name="shipping_method"
                  checked={selectedMethod?.id === method.id}
                  onChange={() => setSelectedMethod(method)}
                  className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 flex-1">
                <label htmlFor={method.id} className="flex justify-between cursor-pointer">
                  <div>
                    <p className="text-base font-medium text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.estimatedDays}</p>
                    {method.id === "local_pickup" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Pickup at vendor location
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-medium text-gray-900">
                      {method.price === 0 ? "Free" : `$${method.price.toFixed(2)}`}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery estimate */}
            {selectedMethod?.id === method.id && method.id !== "local_pickup" && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
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
                  Estimated delivery: {getEstimatedDeliveryDate(method.estimatedDays)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedMethod}
          className="flex-1 px-6 py-3 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}

function getEstimatedDeliveryDate(estimatedDays: string): string {
  const match = estimatedDays.match(/(\d+)-(\d+)/)
  if (!match) return "Soon"

  const maxDays = parseInt(match[2])
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + maxDays)

  return deliveryDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}
