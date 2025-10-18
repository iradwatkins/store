'use client'

interface Category {
  value: string
  label: string
}

interface CategoryFilterProps {
  storeSlug: string
  categories: Category[]
  currentCategory?: string
  currentSearch?: string
}

export default function CategoryFilter({
  storeSlug,
  categories,
  currentCategory,
  currentSearch,
}: CategoryFilterProps) {
  return (
    <form method="GET" action={`/store/${storeSlug}`}>
      <select
        name="category"
        onChange={(e) => e.currentTarget.form?.submit()}
        defaultValue={currentCategory || ""}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      {currentSearch && (
        <input type="hidden" name="search" value={currentSearch} />
      )}
    </form>
  )
}
