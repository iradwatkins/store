"use client"

import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger"

type Announcement = {
  id: string
  title: string
  content: string
  status: string
  createdAt: string
  publishAt: string | null
  isRead: boolean
  readAt: string | null
  author: {
    name: string
    email: string
  }
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        unreadOnly: unreadOnly.toString(),
      })

      const response = await fetch(`/api/vendor/announcements?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch announcements")
      }

      const data = await response.json()
      setAnnouncements(data.announcements)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      logger.error("Failed to fetch announcements:", err)
      setError("Failed to load announcements")
    } finally {
      setIsLoading(false)
    }
  }, [unreadOnly])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const markAsRead = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/vendor/announcements/${announcementId}/read`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to mark as read")
      }

      // Update local state
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId
            ? { ...a, isRead: true, readAt: new Date().toISOString() }
            : a
        )
      )

      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      logger.error("Failed to mark announcement as read:", err)
    }
  }

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    if (!announcement.isRead) {
      markAsRead(announcement.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading && announcements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    )
  }

  if (error && announcements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAnnouncements}
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Announcements</h1>
          <p className="text-muted-foreground">Important updates and news from the platform</p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
            {unreadCount} Unread
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            !unreadOnly
              ? "bg-primary text-white"
              : "bg-secondary text-foreground hover:bg-secondary/80"
          }`}
        >
          All Announcements
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            unreadOnly
              ? "bg-primary text-white"
              : "bg-secondary text-foreground hover:bg-secondary/80"
          }`}
        >
          Unread Only {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Announcements List */}
      <div className="grid gap-4">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              onClick={() => handleAnnouncementClick(announcement)}
              className={`bg-card rounded-lg shadow p-6 cursor-pointer transition hover:shadow-md ${
                !announcement.isRead ? "border-l-4 border-blue-500" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {announcement.title}
                    </h3>
                    {!announcement.isRead && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(announcement.createdAt)} • By {announcement.author.name}
                  </p>
                </div>
              </div>
              <p className="text-foreground line-clamp-2">{announcement.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-4 text-muted-foreground">No announcements found</p>
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {selectedAnnouncement.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedAnnouncement.createdAt)} • By{" "}
                  {selectedAnnouncement.author.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-foreground">
                {selectedAnnouncement.content}
              </div>
            </div>

            {selectedAnnouncement.readAt && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Read on {formatDate(selectedAnnouncement.readAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
