"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PRODUCT_CATEGORIES, getSubcategories } from "@/lib/categories"
import { ProductVariantWizard, type VariantWizardData } from "../components/wizard/ProductVariantWizard"

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.enum([
    "ACCESSORIES", "ART_AND_COLLECTIBLES", "BAGS_AND_PURSES", "BATH_AND_BEAUTY",
    "BOOKS_MOVIES_AND_MUSIC", "CLOTHING", "CRAFT_SUPPLIES_AND_TOOLS",
    "ELECTRONICS_AND_ACCESSORIES", "HOME_AND_LIVING", "JEWELRY",
    "PAPER_AND_PARTY_SUPPLIES", "PET_SUPPLIES", "SHOES", "TOYS_AND_GAMES", "WEDDINGS"
  ], {
    required_error: "Please select a category",
  }),
  subcategory: z.string().optional(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Price must be a positive number",
  }),
  compareAtPrice: z.string().optional(),
  sku: z.string().optional(),
  trackInventory: z.boolean().default(true),
  inventoryQuantity: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Variant wizard state
  const [showVariantWizard, setShowVariantWizard] = useState(false)
  const [wizardData, setWizardData] = useState<Partial<VariantWizardData> | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      trackInventory: true,
    },
  })

  const selectedCategory = watch("category")
  const trackInventory = watch("trackInventory")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + selectedImages.length > 5) {
      setError("Maximum 5 images allowed")
      return
    }

    setSelectedImages([...selectedImages, ...files])

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  // Handle variant wizard completion
  const handleWizardComplete = async (data: VariantWizardData) => {
    setWizardData(data)
    setShowVariantWizard(false)
    return Promise.resolve()
  }

  // Handle wizard cancel
  const handleWizardCancel = () => {
    setShowVariantWizard(false)
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("description", data.description)
      formData.append("category", data.category)
      formData.append("price", data.price)

      if (data.subcategory) {
        formData.append("subcategory", data.subcategory)
      }
      if (data.compareAtPrice) {
        formData.append("compareAtPrice", data.compareAtPrice)
      }
      if (data.sku) {
        formData.append("sku", data.sku)
      }

      formData.append("trackInventory", String(data.trackInventory))

      if (data.inventoryQuantity) {
        formData.append("inventoryQuantity", data.inventoryQuantity)
      }

      // Add variant data (backward compatible with old system)
      if (wizardData && wizardData.hasVariants) {
        // NEW MULTI-VARIANT SYSTEM
        formData.append("useMultiVariants", "true")
        formData.append("variantTypes", JSON.stringify(wizardData.selectedVariantTypes || []))
        formData.append("variantOptions", JSON.stringify(wizardData.variantOptions || {}))
        formData.append("generateCombinations", "true")

        // OLD SYSTEM (for backward compatibility)
        formData.append("variantType", "NONE")

        // Include bulk settings for the API to use when generating combinations
        if (wizardData.bulkSettings) {
          formData.append("bulkSettings", JSON.stringify(wizardData.bulkSettings))
        }
      } else {
        // NO VARIANTS - Send old system fields for backward compatibility
        formData.append("variantType", "NONE")
        formData.append("useMultiVariants", "false")
      }

      // Add images
      selectedImages.forEach((image) => {
        formData.append("images", image)
      })

      const response = await fetch("/api/vendor/products", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create product")
      }

      router.push("/dashboard/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new product for your store
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                {...register("name")}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Chicago Steppin Dress Shirt"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Describe your product..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                {...register("category")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {selectedCategory && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  Subcategory (Optional)
                </label>
                <select
                  {...register("subcategory")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a subcategory</option>
                  {getSubcategories(selectedCategory).map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  {...register("price")}
                  type="text"
                  className="block w-full pl-7 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700">
                Compare at Price (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  {...register("compareAtPrice")}
                  type="text"
                  className="block w-full pl-7 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU (Optional)
              </label>
              <input
                {...register("sku")}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="SHIRT-001"
              />
            </div>

            <div className="flex items-center">
              <input
                {...register("trackInventory")}
                type="checkbox"
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="trackInventory" className="ml-2 block text-sm text-gray-900">
                Track inventory quantity
              </label>
            </div>

            {trackInventory && (
              <div>
                <label htmlFor="inventoryQuantity" className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  {...register("inventoryQuantity")}
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  For products with variants, inventory is managed per variant in the variant configuration.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Variants */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Product Variants</h2>
              <p className="mt-1 text-sm text-gray-600">
                Add size, color, and other variant options
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowVariantWizard(true)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
            >
              {wizardData ? 'Edit Variants' : 'Configure Variants'}
            </button>
          </div>

          {wizardData && wizardData.hasVariants ? (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">Variants Configured</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p><strong>Variant Types:</strong> {wizardData.selectedVariantTypes?.join(', ')}</p>
                    <p className="mt-1">
                      <strong>Combinations:</strong>{' '}
                      {wizardData.selectedVariantTypes?.reduce((total, type) => {
                        const options = wizardData.variantOptions?.[type]?.selectedPresetOptions || []
                        const custom = wizardData.variantOptions?.[type]?.customOptions || []
                        return total * Math.max((options.length + custom.length), 1)
                      }, 1) || 0} total variant combinations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                No variants configured. Click "Configure Variants" to add size, color, and other options.
              </p>
            </div>
          )}
        </div>

        {/* Variant Wizard Modal */}
        {showVariantWizard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <ProductVariantWizard
                  initialData={wizardData || undefined}
                  onComplete={handleWizardComplete}
                  onCancel={handleWizardCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Images */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Images (Max 5)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-600
                  hover:file:bg-blue-100"
              />
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  )
}
