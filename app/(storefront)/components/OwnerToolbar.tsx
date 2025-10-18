type OwnerToolbarProps = {
  productId?: string
  storeSlug: string
}

export default function OwnerToolbar({ productId, storeSlug }: OwnerToolbarProps) {
  return (
    <div className="bg-blue-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium">
              You are viewing your store as the owner
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Edit Product Button (if on product page) */}
            {productId && (
              <a
                href={`/dashboard/products/${productId}/edit`}
                className="inline-flex items-center px-3 py-1.5 border border-white/20 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Product
              </a>
            )}

            {/* Dashboard Link */}
            <a
              href="/dashboard/products"
              className="inline-flex items-center px-3 py-1.5 border border-white/20 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </a>

            {/* Info Badge */}
            <span className="inline-flex items-center px-2.5 py-1 bg-blue-400 rounded-md text-xs font-medium">
              Admin View
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
