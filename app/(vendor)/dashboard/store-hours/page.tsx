"use client"

import { useState, useEffect } from "react"
import { logger } from "@/lib/logger"

type DayHours = {
  open?: string
  close?: string
  closed?: boolean
}

type StoreHours = {
  id: string
  monday: DayHours | null
  tuesday: DayHours | null
  wednesday: DayHours | null
  thursday: DayHours | null
  friday: DayHours | null
  saturday: DayHours | null
  sunday: DayHours | null
  timezone: string
  isEnabled: boolean
}

type Vacation = {
  id: string
  startDate: string
  endDate: string
  message: string | null
  isActive: boolean
  createdAt: string
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export default function StoreHoursPage() {
  const [_storeHours, setStoreHours] = useState<StoreHours | null>(null)
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [_error, setError] = useState<string | null>(null)
  const [showCreateVacation, setShowCreateVacation] = useState(false)
  const [deletingVacationId, setDeletingVacationId] = useState<string | null>(null)

  const [hours, setHours] = useState<Record<string, DayHours>>({
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '', close: '', closed: true },
  })
  const [hoursEnabled, setHoursEnabled] = useState(true)

  const [newVacation, setNewVacation] = useState({
    startDate: '',
    endDate: '',
    message: '',
    isActive: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [hoursRes, vacationsRes] = await Promise.all([
        fetch('/api/vendor/store-hours'),
        fetch('/api/vendor/vacations'),
      ])

      if (hoursRes.ok) {
        const hoursData = await hoursRes.json()
        if (hoursData.storeHours) {
          setStoreHours(hoursData.storeHours)
          const parsedHours: Record<string, DayHours> = {}
          DAYS.forEach(day => {
            const dayData = hoursData.storeHours[day]
            parsedHours[day] = dayData || { open: '', close: '', closed: true }
          })
          setHours(parsedHours)
          setHoursEnabled(hoursData.storeHours.isEnabled)
        }
      }

      if (vacationsRes.ok) {
        const vacationsData = await vacationsRes.json()
        setVacations(vacationsData.vacations || [])
      }
    } catch (err) {
      logger.error('Failed to fetch data:', err)
      setError('Failed to load store settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveHours = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/vendor/store-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...hours,
          timezone: 'America/New_York',
          isEnabled: hoursEnabled,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save hours')
      }

      alert('Store hours saved successfully!')
      fetchData()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save hours'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateVacation = async () => {
    if (!newVacation.startDate || !newVacation.endDate) {
      alert('Start and end dates are required')
      return
    }

    try {
      const response = await fetch('/api/vendor/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVacation),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create vacation')
      }

      setNewVacation({ startDate: '', endDate: '', message: '', isActive: true })
      setShowCreateVacation(false)
      fetchData()
      alert('Vacation period created successfully!')
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to create vacation'}`)
    }
  }

  const handleDeleteVacation = async (vacationId: string) => {
    if (!confirm('Are you sure you want to delete this vacation period?')) {return}

    setDeletingVacationId(vacationId)

    try {
      const response = await fetch(`/api/vendor/vacations/${vacationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete vacation')
      }

      fetchData()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete vacation'}`)
    } finally {
      setDeletingVacationId(null)
    }
  }

  const toggleVacationActive = async (vacationId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/vendor/vacations/${vacationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to toggle vacation')
      }

      fetchData()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to toggle vacation'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading store settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Hours & Vacation Mode</h1>
        <p className="mt-1 text-sm text-gray-600">
          Set your operating hours and vacation periods
        </p>
      </div>

      {/* Store Hours Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Store Hours</h2>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={hoursEnabled}
              onChange={(e) => setHoursEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-500 rounded"
            />
            <span className="ml-2 text-sm font-medium">Enable Store Hours</span>
          </label>
        </div>

        <div className="space-y-4">
          {DAYS.map((day) => (
            <div key={day} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2">
                <span className="font-medium">{DAY_LABELS[day]}</span>
              </div>
              <div className="col-span-3">
                <input
                  type="time"
                  value={hours[day].closed ? '' : hours[day].open || ''}
                  onChange={(e) => setHours({
                    ...hours,
                    [day]: { ...hours[day], open: e.target.value }
                  })}
                  disabled={hours[day].closed}
                  className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100"
                />
              </div>
              <div className="col-span-1 text-center">
                <span className="text-gray-500">to</span>
              </div>
              <div className="col-span-3">
                <input
                  type="time"
                  value={hours[day].closed ? '' : hours[day].close || ''}
                  onChange={(e) => setHours({
                    ...hours,
                    [day]: { ...hours[day], close: e.target.value }
                  })}
                  disabled={hours[day].closed}
                  className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100"
                />
              </div>
              <div className="col-span-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hours[day].closed || false}
                    onChange={(e) => setHours({
                      ...hours,
                      [day]: { ...hours[day], closed: e.target.checked }
                    })}
                    className="h-4 w-4 text-blue-500 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Closed</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveHours}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      </div>

      {/* Vacation Periods Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Vacation Periods</h2>
            <p className="text-sm text-gray-600">Schedule times when your store is closed</p>
          </div>
          <button
            onClick={() => setShowCreateVacation(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Vacation
          </button>
        </div>

        {/* Create Vacation Modal */}
        {showCreateVacation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Schedule Vacation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={newVacation.startDate}
                    onChange={(e) => setNewVacation({ ...newVacation, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    value={newVacation.endDate}
                    onChange={(e) => setNewVacation({ ...newVacation, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message (optional)</label>
                  <textarea
                    value={newVacation.message}
                    onChange={(e) => setNewVacation({ ...newVacation, message: e.target.value })}
                    placeholder="We'll be closed for vacation. Back soon!"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newVacation.isActive}
                    onChange={(e) => setNewVacation({ ...newVacation, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-500 rounded"
                  />
                  <span className="ml-2 text-sm">Active</span>
                </label>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateVacation(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVacation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vacations List */}
        <div className="space-y-3">
          {vacations.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No vacation periods scheduled</p>
          ) : (
            vacations.map((vacation) => (
              <div key={vacation.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">
                        {new Date(vacation.startDate).toLocaleDateString()} - {new Date(vacation.endDate).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${vacation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {vacation.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {vacation.message && (
                      <p className="text-sm text-gray-600">{vacation.message}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleVacationActive(vacation.id, vacation.isActive)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      {vacation.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteVacation(vacation.id)}
                      disabled={deletingVacationId === vacation.id}
                      className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingVacationId === vacation.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
