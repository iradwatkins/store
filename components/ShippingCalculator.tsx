"use client"

import { useState } from "react"

type ShippingRate = {
  id: string
  name: string
  price: number
  estimatedDays: string
  carrier: string
}

type Props = {
  cartTotal: number
  onRateSelected?: (rate: ShippingRate) => void
  compact?: boolean
}

export default function ShippingCalculator({ cartTotal, onRateSelected, compact = false }: Props) {
  const [zipCode, setZipCode] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(!compact)

  const handleCalculate = async () => {
    setError(null)

    // Validate ZIP code (US format)
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setError("Please enter a valid US ZIP code")
      return
    }

    setIsCalculating(true)

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zipCode,
          cartTotal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to calculate shipping")
      }

      setRates(data.rates || [])
      if (data.rates && data.rates.length > 0) {
        setIsExpanded(true)
      }
    } catch (err) {
      console.error("Failed to calculate shipping:", err)
      setError(err instanceof Error ? err.message : "Failed to calculate shipping")
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSelectRate = (rate: ShippingRate) => {
    setSelectedRate(rate)
    if (onRateSelected) {
      onRateSelected(rate)
    }
  }

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Calculate shipping
      </button>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Estimate Shipping</h3>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="ZIP Code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/[^\d-]/g, ""))}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleCalculate()
              }
            }}
            maxLength={10}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleCalculate}
            disabled={isCalculating || !zipCode}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Calculate"
            )}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 flex items-start">
            <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {rates.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium">Available shipping options:</p>
            {rates.map((rate) => (
              <div
                key={rate.id}
                onClick={() => handleSelectRate(rate)}
                className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-all ${
                  selectedRate?.id === rate.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 bg-white"
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={selectedRate?.id === rate.id}
                    onChange={() => handleSelectRate(rate)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{rate.name}</p>
                    <p className="text-xs text-gray-500">{rate.estimatedDays}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {rate.price === 0 ? "Free" : `$${rate.price.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-gray-500">{rate.carrier}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {rates.length === 0 && !error && zipCode && !isCalculating && (
          <p className="text-xs text-gray-500 italic">
            Enter your ZIP code to see shipping options
          </p>
        )}
      </div>
    </div>
  )
}
