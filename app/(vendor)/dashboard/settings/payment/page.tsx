"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

type PaymentProcessor = "STRIPE" | "PAYPAL" | "SQUARE" | "CASH"

interface PaymentSettings {
  primaryPaymentProcessor: PaymentProcessor
  secondaryPaymentProcessor?: PaymentProcessor
  // Stripe
  stripeAccountId?: string
  stripeChargesEnabled: boolean
  // PayPal
  paypalEmail?: string
  paypalMerchantId?: string
  // Square
  squareAccessToken?: string
  squareLocationId?: string
  // Cash
  acceptsCash: boolean
  cashInstructions?: string
}

export default function PaymentSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PaymentSettings>({
    primaryPaymentProcessor: "STRIPE",
    stripeChargesEnabled: false,
    acceptsCash: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const response = await fetch("/api/dashboard/settings/payment")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      logger.error("Failed to fetch payment settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch("/api/dashboard/settings/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert("Payment settings saved successfully!")
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || "Failed to save settings"}`)
      }
    } catch {
      alert("Failed to save payment settings")
    } finally {
      setSaving(false)
    }
  }

  const paymentOptions: { value: PaymentProcessor; label: string; description: string }[] = [
    {
      value: "STRIPE",
      label: "Stripe",
      description: "Accept credit cards and digital wallets (2.9% + $0.30 per transaction)",
    },
    {
      value: "PAYPAL",
      label: "PayPal",
      description: "Accept PayPal payments (2.9% + $0.30 per transaction)",
    },
    {
      value: "SQUARE",
      label: "Square",
      description: "Accept payments via Square (2.6% + $0.10 per transaction)",
    },
    {
      value: "CASH",
      label: "Cash",
      description: "Accept cash payments (in-person pickup required)",
    },
  ]

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
        <p className="text-gray-600">
          Configure how you want to receive payments. Choose one primary method and optionally one
          backup method.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Primary Payment Method</h2>
        <p className="text-sm text-gray-600 mb-4">
          This is your main payment method. All customers will see this option.
        </p>

        <div className="space-y-3">
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                settings.primaryPaymentProcessor === option.value
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="primaryPaymentProcessor"
                value={option.value}
                checked={settings.primaryPaymentProcessor === option.value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    primaryPaymentProcessor: e.target.value as PaymentProcessor,
                  })
                }
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Secondary Payment Method (Optional)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Offer customers an alternative payment option as backup.
        </p>

        <div className="space-y-3">
          <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-gray-300">
            <input
              type="radio"
              name="secondaryPaymentProcessor"
              checked={!settings.secondaryPaymentProcessor}
              onChange={() =>
                setSettings({
                  ...settings,
                  secondaryPaymentProcessor: undefined,
                })
              }
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="font-semibold">None</div>
              <div className="text-sm text-gray-600">Don&apos;t offer a secondary payment method</div>
            </div>
          </label>

          {paymentOptions
            .filter((opt) => opt.value !== settings.primaryPaymentProcessor)
            .map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  settings.secondaryPaymentProcessor === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="secondaryPaymentProcessor"
                  value={option.value}
                  checked={settings.secondaryPaymentProcessor === option.value}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      secondaryPaymentProcessor: e.target.value as PaymentProcessor,
                    })
                  }
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
        </div>
      </div>

      {/* Stripe Configuration */}
      {(settings.primaryPaymentProcessor === "STRIPE" ||
        settings.secondaryPaymentProcessor === "STRIPE") && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Stripe Configuration</h2>
          {settings.stripeAccountId ? (
            <div>
              <div className="flex items-center mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    settings.stripeChargesEnabled
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {settings.stripeChargesEnabled ? "✓ Connected" : "⏳ Pending"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Account ID: {settings.stripeAccountId}
              </p>
              {!settings.stripeChargesEnabled && (
                <p className="text-sm text-yellow-700 mb-4">
                  Complete your Stripe onboarding to accept payments.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Connect your Stripe account to accept credit card payments.
              </p>
              <button
                onClick={() => router.push("/create-store?connectStripe=true")}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Connect Stripe
              </button>
            </div>
          )}
        </div>
      )}

      {/* PayPal Configuration */}
      {(settings.primaryPaymentProcessor === "PAYPAL" ||
        settings.secondaryPaymentProcessor === "PAYPAL") && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">PayPal Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">PayPal Email Address</label>
              <input
                type="email"
                value={settings.paypalEmail || ""}
                onChange={(e) => setSettings({ ...settings, paypalEmail: e.target.value })}
                placeholder="your-email@example.com"
                className="w-full border rounded-lg px-4 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                This is where you&apos;ll receive PayPal payments
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                PayPal Merchant ID (Optional)
              </label>
              <input
                type="text"
                value={settings.paypalMerchantId || ""}
                onChange={(e) => setSettings({ ...settings, paypalMerchantId: e.target.value })}
                placeholder="MERCHANT_ID_HERE"
                className="w-full border rounded-lg px-4 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                For PayPal Commerce Platform integration
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Square Configuration */}
      {(settings.primaryPaymentProcessor === "SQUARE" ||
        settings.secondaryPaymentProcessor === "SQUARE") && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Square Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Square Access Token</label>
              <input
                type="password"
                value={settings.squareAccessToken || ""}
                onChange={(e) => setSettings({ ...settings, squareAccessToken: e.target.value })}
                placeholder="sq0atp-..."
                className="w-full border rounded-lg px-4 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Get this from your Square Developer Dashboard
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Square Location ID</label>
              <input
                type="text"
                value={settings.squareLocationId || ""}
                onChange={(e) => setSettings({ ...settings, squareLocationId: e.target.value })}
                placeholder="LOCATION_ID_HERE"
                className="w-full border rounded-lg px-4 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your Square business location ID
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cash Configuration */}
      {(settings.primaryPaymentProcessor === "CASH" ||
        settings.secondaryPaymentProcessor === "CASH") && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cash Payment Instructions</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={settings.acceptsCash}
                  onChange={(e) => setSettings({ ...settings, acceptsCash: e.target.checked })}
                  className="mr-2"
                />
                <span className="font-medium">I accept cash payments</span>
              </label>
            </div>
            {settings.acceptsCash && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cash Payment Instructions
                </label>
                <textarea
                  value={settings.cashInstructions || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, cashInstructions: e.target.value })
                  }
                  placeholder="E.g., Pickup available at 123 Main St, Chicago IL. Cash only. Please bring exact change."
                  className="w-full border rounded-lg px-4 py-2 h-32"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tell customers where and how to pay cash
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Payment Settings"}
        </button>
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Payment Processing Fees</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Platform fee: 7% on all transactions</li>
          <li>• Stripe: 2.9% + $0.30 per transaction</li>
          <li>• PayPal: 2.9% + $0.30 per transaction</li>
          <li>• Square: 2.6% + $0.10 per transaction</li>
          <li>• Cash: No processing fees (platform fee still applies)</li>
        </ul>
      </div>
    </div>
  )
}
