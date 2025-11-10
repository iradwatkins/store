"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

type Withdraw = {
  id: string
  amount: number
  method: string
  status: string
  requestedAt: string
  processedAt: string | null
  notes?: string
  adminNotes?: string
}

type WithdrawData = {
  withdraws: Withdraw[]
  balance: number
  minimumWithdraw: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function WithdrawsPage() {
  const _router = useRouter()
  const [data, setData] = useState<WithdrawData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Create withdraw form state
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<string>("STRIPE")
  const [notes, setNotes] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchWithdraws = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: "20",
      })

      const response = await fetch(`/api/vendor/withdraws?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch withdraws")
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      logger.error("Failed to fetch withdraws:", err)
      setError("Failed to load withdraw requests")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, currentPage])

  useEffect(() => {
    fetchWithdraws()
  }, [fetchWithdraws])

  const handleCreateWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await fetch("/api/vendor/withdraws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          notes: notes || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create withdraw")
      }

      // Reset form and close modal
      setAmount("")
      setNotes("")
      setShowCreateModal(false)

      // Refresh list
      await fetchWithdraws()
    } catch (err: any) {
      logger.error("Failed to create withdraw:", err)
      setCreateError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelWithdraw = async (withdrawId: string) => {
    if (!confirm("Are you sure you want to cancel this withdraw request?")) {
      return
    }

    try {
      const response = await fetch(`/api/vendor/withdraws/${withdrawId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to cancel withdraw")
      }

      // Refresh list
      await fetchWithdraws()
    } catch (err: any) {
      logger.error("Failed to cancel withdraw:", err)
      alert(err.message)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-purple-100 text-purple-800",
      PAID: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      REJECTED: "bg-red-100 text-red-800",
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading withdraws...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchWithdraws}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Withdraws</h1>
        <p className="text-muted-foreground">Manage your earnings and withdraw requests</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Available Balance</p>
            <p className="text-4xl font-bold">${data?.balance.toFixed(2) || "0.00"}</p>
            <p className="text-emerald-100 text-sm mt-2">
              Minimum withdraw: ${data?.minimumWithdraw.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!data || data.balance < data.minimumWithdraw}
            className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Withdraw
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {["all", "PENDING", "APPROVED", "PROCESSING", "PAID", "CANCELLED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Withdraws List */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Processed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.withdraws && data.withdraws.length > 0 ? (
                data.withdraws.map((withdraw) => (
                  <tr key={withdraw.id} className="hover:bg-secondary/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(withdraw.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      ${withdraw.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {withdraw.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(withdraw.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {withdraw.processedAt ? formatDate(withdraw.processedAt) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {withdraw.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelWithdraw(withdraw.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                      {withdraw.adminNotes && (
                        <button
                          onClick={() => alert(withdraw.adminNotes)}
                          className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Notes
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No withdraw requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {currentPage} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === data.pagination.totalPages}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Withdraw Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Request Withdraw</h2>

            {createError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateWithdraw}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min={data?.minimumWithdraw}
                  max={data?.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={`Min: $${data?.minimumWithdraw}, Max: $${data?.balance}`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="STRIPE">Stripe</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="SKRILL">Skrill</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateError(null)
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-secondary transition"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isCreating ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
