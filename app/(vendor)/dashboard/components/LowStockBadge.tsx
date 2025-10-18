import React from "react"

type LowStockBadgeProps = {
  stock: number
  lowStockThreshold?: number
  variant?: "default" | "compact"
}

export default function LowStockBadge({
  stock,
  lowStockThreshold = 5,
  variant = "default",
}: LowStockBadgeProps) {
  if (stock > lowStockThreshold) {
    return null
  }

  if (stock === 0) {
    return (
      <span
        className={`inline-flex items-center ${
          variant === "compact" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
        } rounded-md font-medium bg-red-100 text-red-800`}
      >
        <svg
          className={`${variant === "compact" ? "h-3 w-3" : "h-4 w-4"} mr-1`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        Out of Stock
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center ${
        variant === "compact" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      } rounded-md font-medium bg-orange-100 text-orange-800`}
    >
      <svg
        className={`${variant === "compact" ? "h-3 w-3" : "h-4 w-4"} mr-1`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Low Stock ({stock} left)
    </span>
  )
}
