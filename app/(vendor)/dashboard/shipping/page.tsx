"use client"

import { useState, useEffect } from "react"
import { logger } from "@/lib/logger"

type ShippingRate = {
  id: string
  name: string
  type: string
  cost: number
  minOrderAmount: number | null
  isEnabled: boolean
  sortOrder: number
}

type ShippingZone = {
  id: string
  name: string
  regions: any
  isEnabled: boolean
  priority: number
  shippingRates: ShippingRate[]
}

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateZone, setShowCreateZone] = useState(false)
  const [showCreateRate, setShowCreateRate] = useState<string | null>(null)
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null)
  const [deletingRateId, setDeletingRateId] = useState<string | null>(null)

  const [newZone, setNewZone] = useState({
    name: '',
    regions: '{}',
    isEnabled: true,
    priority: 0,
  })

  const [newRate, setNewRate] = useState({
    name: '',
    type: 'FLAT_RATE',
    cost: '',
    minOrderAmount: '',
    isEnabled: true,
    sortOrder: 0,
  })

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vendor/shipping/zones')

      if (!response.ok) {
        throw new Error('Failed to fetch shipping zones')
      }

      const data = await response.json()
      setZones(data.zones)
    } catch (err) {
      logger.error('Failed to fetch zones:', err)
      setError('Failed to load shipping zones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateZone = async () => {
    if (!newZone.name) {
      alert('Zone name is required')
      return
    }

    try {
      let parsedRegions = {}
      try {
        parsedRegions = JSON.parse(newZone.regions)
      } catch {
        alert('Invalid regions JSON format')
        return
      }

      const response = await fetch('/api/vendor/shipping/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newZone.name,
          regions: parsedRegions,
          isEnabled: newZone.isEnabled,
          priority: newZone.priority,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create zone')
      }

      setNewZone({ name: '', regions: '{}', isEnabled: true, priority: 0 })
      setShowCreateZone(false)
      fetchZones()
      alert('Zone created successfully!')
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to create zone'}`)
    }
  }

  const handleCreateRate = async (zoneId: string) => {
    if (!newRate.name || !newRate.cost) {
      alert('Rate name and cost are required')
      return
    }

    try {
      const response = await fetch(`/api/vendor/shipping/zones/${zoneId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRate.name,
          type: newRate.type,
          cost: parseFloat(newRate.cost),
          minOrderAmount: newRate.minOrderAmount ? parseFloat(newRate.minOrderAmount) : null,
          isEnabled: newRate.isEnabled,
          sortOrder: newRate.sortOrder,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create rate')
      }

      setNewRate({
        name: '',
        type: 'FLAT_RATE',
        cost: '',
        minOrderAmount: '',
        isEnabled: true,
        sortOrder: 0,
      })
      setShowCreateRate(null)
      fetchZones()
      alert('Rate created successfully!')
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to create rate'}`)
    }
  }

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this zone? All rates will also be deleted.')) {return}

    setDeletingZoneId(zoneId)

    try {
      const response = await fetch(`/api/vendor/shipping/zones/${zoneId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete zone')
      }

      fetchZones()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete zone'}`)
    } finally {
      setDeletingZoneId(null)
    }
  }

  const handleDeleteRate = async (zoneId: string, rateId: string) => {
    if (!confirm('Are you sure you want to delete this shipping rate?')) {return}

    setDeletingRateId(rateId)

    try {
      const response = await fetch(`/api/vendor/shipping/zones/${zoneId}/rates/${rateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete rate')
      }

      fetchZones()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete rate'}`)
    } finally {
      setDeletingRateId(null)
    }
  }

  const toggleZoneEnabled = async (zoneId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/vendor/shipping/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to toggle zone')
      }

      fetchZones()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to toggle zone'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading shipping zones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchZones}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Zones</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage shipping zones and rates for your store
          </p>
        </div>
        <button
          onClick={() => setShowCreateZone(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Zone
        </button>
      </div>

      {/* Create Zone Modal */}
      {showCreateZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create Shipping Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Zone Name *</label>
                <input
                  type="text"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  placeholder="e.g., Domestic, International, Local"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Regions (JSON)</label>
                <textarea
                  value={newZone.regions}
                  onChange={(e) => setNewZone({ ...newZone, regions: e.target.value })}
                  placeholder='{"countries": ["US", "CA"]}'
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <input
                  type="number"
                  value={newZone.priority}
                  onChange={(e) => setNewZone({ ...newZone, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newZone.isEnabled}
                  onChange={(e) => setNewZone({ ...newZone, isEnabled: e.target.checked })}
                  className="h-4 w-4 text-blue-500"
                />
                <span className="ml-2 text-sm">Enabled</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateZone(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateZone}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zones List */}
      <div className="space-y-4">
        {zones.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No shipping zones yet. Create your first zone!</p>
          </div>
        ) : (
          zones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold">{zone.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${zone.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {zone.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Priority: {zone.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleZoneEnabled(zone.id, zone.isEnabled)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    {zone.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    disabled={deletingZoneId === zone.id}
                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingZoneId === zone.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Shipping Rates */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Shipping Rates ({zone.shippingRates.length})</h4>
                  <button
                    onClick={() => setShowCreateRate(zone.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Rate
                  </button>
                </div>

                {showCreateRate === zone.id && (
                  <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <h5 className="font-medium mb-3">New Shipping Rate</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1">Name *</label>
                        <input
                          type="text"
                          value={newRate.name}
                          onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                          placeholder="Standard Shipping"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Type *</label>
                        <select
                          value={newRate.type}
                          onChange={(e) => setNewRate({ ...newRate, type: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="FLAT_RATE">Flat Rate</option>
                          <option value="FREE_SHIPPING">Free Shipping</option>
                          <option value="WEIGHT_BASED">Weight Based</option>
                          <option value="LOCAL_PICKUP">Local Pickup</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Cost *</label>
                        <input
                          type="number"
                          value={newRate.cost}
                          onChange={(e) => setNewRate({ ...newRate, cost: e.target.value })}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Min Order Amount</label>
                        <input
                          type="number"
                          value={newRate.minOrderAmount}
                          onChange={(e) => setNewRate({ ...newRate, minOrderAmount: e.target.value })}
                          placeholder="Optional"
                          step="0.01"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={() => setShowCreateRate(null)}
                        className="px-3 py-1 text-sm border rounded hover:bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleCreateRate(zone.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add Rate
                      </button>
                    </div>
                  </div>
                )}

                {zone.shippingRates.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No rates added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {zone.shippingRates.map((rate) => (
                      <div key={rate.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{rate.name}</div>
                          <div className="text-sm text-gray-600">
                            {rate.type.replace('_', ' ')} • ${rate.cost.toFixed(2)}
                            {rate.minOrderAmount && ` • Min: $${rate.minOrderAmount.toFixed(2)}`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRate(zone.id, rate.id)}
                          disabled={deletingRateId === rate.id}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingRateId === rate.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
