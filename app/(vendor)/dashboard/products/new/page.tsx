"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PRODUCT_CATEGORIES, getSubcategories } from "@/lib/categories"

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
  variantType: z.string().default("NONE"), // This will store comma-separated types or "NONE"
  variants: z.array(z.object({
    name: z.string(),
    sku: z.string().optional(),
    price: z.string().optional(),
    inventoryQuantity: z.string().optional(),
    inStock: z.boolean().default(true),
  })).optional(),
})

type ProductFormData = z.infer<typeof productSchema>

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"]
const COLOR_OPTIONS = [
  { value: "black", label: "Black", hex: "#000000" },
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "red", label: "Red", hex: "#DC2626" },
  { value: "blue", label: "Blue", hex: "#2563EB" },
  { value: "green", label: "Green", hex: "#16A34A" },
  { value: "navy", label: "Navy", hex: "#1E3A8A" },
  { value: "gray", label: "Gray", hex: "#6B7280" },
  { value: "pink", label: "Pink", hex: "#EC4899" },
  { value: "purple", label: "Purple", hex: "#9333EA" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "orange", label: "Orange", hex: "#EA580C" },
  { value: "brown", label: "Brown", hex: "#92400E" },
  { value: "beige", label: "Beige", hex: "#D4A574" },
  { value: "gold", label: "Gold", hex: "#D97706" },
  { value: "silver", label: "Silver", hex: "#9CA3AF" },
]

export default function NewProductPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Variant state
  const [variantType, setVariantType] = useState<"NONE" | "SIZE" | "COLOR">("NONE")
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [customInput, setCustomInput] = useState<string>("")

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [variantPricingEnabled, setVariantPricingEnabled] = useState(false)
  const [trackInventorySeparately, setTrackInventorySeparately] = useState(true)
  const [showSkuFields, setShowSkuFields] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      variantType: "NONE",
      trackInventory: true,
      variants: [],
    },
  })

  const selectedCategory = watch("category")
  const trackInventory = watch("trackInventory")

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "variants",
  })

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

  // Generate variants - use replace to avoid triggering infinite loop
  const generateVariants = useCallback(() => {
    if (variantType === "NONE" || selectedOptions.length === 0) {
      replace([])
      return
    }

    // Create variant for each selected option
    const newVariants = selectedOptions.map((option) => ({
      name: option,
      sku: "",
      price: "",
      inventoryQuantity: "",
      inStock: true,
    }))

    replace(newVariants)
  }, [selectedOptions, variantType, replace])

  // Generate variants when selections change
  useEffect(() => {
    generateVariants()
  }, [generateVariants])

  // Handle variant type change
  const handleVariantTypeChange = (newType: "NONE" | "SIZE" | "COLOR") => {
    setSelectedOptions([])
    setCustomInput("")
    setVariantType(newType)
    setValue("variantType", newType)
  }

  // Handle option toggle
  const handleOptionToggle = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter(o => o !== option)
      : [...selectedOptions, option]
    setSelectedOptions(newSelection)
  }

  // Select/Clear all options
  const handleSelectAll = () => {
    if (variantType === "SIZE") {
      setSelectedOptions([...SIZE_OPTIONS])
    } else if (variantType === "COLOR") {
      setSelectedOptions(COLOR_OPTIONS.map(c => c.label))
    }
  }

  const handleClearAll = () => {
    setSelectedOptions([])
  }

  // Handle adding custom option
  const handleAddCustomOption = () => {
    const trimmedInput = customInput.trim()
    if (trimmedInput && !selectedOptions.includes(trimmedInput)) {
      setSelectedOptions([...selectedOptions, trimmedInput])
      setCustomInput("")
    }
  }

  // Handle removing an option
  const handleRemoveOption = (option: string) => {
    setSelectedOptions(selectedOptions.filter(o => o !== option))
  }

  // Handle Enter key in custom input
  const handleCustomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddCustomOption()
    }
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

      formData.append("variantType", data.variantType)

      // Add variants if present
      if (data.variants && data.variants.length > 0) {
        formData.append("variants", JSON.stringify(data.variants))
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

            {/* Only show product-level inventory if NO variants selected */}
            {variantType === "NONE" && (
              <>
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
                  </div>
                )}
              </>
            )}

            {/* Show info message when variants are selected */}
            {variantType !== "NONE" && (
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Inventory tracking is managed at the variant level. Set quantities for each variant in the table below.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Options */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Options</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Does this product have variants?
              </label>
              <div className="space-y-2">
                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  variantType === "NONE" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}>
                  <input
                    type="radio"
                    checked={variantType === "NONE"}
                    onChange={() => handleVariantTypeChange("NONE")}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    No variants (single product)
                  </span>
                </label>

                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  variantType === "SIZE" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}>
                  <input
                    type="radio"
                    checked={variantType === "SIZE"}
                    onChange={() => handleVariantTypeChange("SIZE")}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Sizes (clothing, shoes, etc.)
                  </span>
                </label>

                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  variantType === "COLOR" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}>
                  <input
                    type="radio"
                    checked={variantType === "COLOR"}
                    onChange={() => handleVariantTypeChange("COLOR")}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Colors
                  </span>
                </label>
              </div>
            </div>

            {/* Size Selection */}
            {variantType === "SIZE" && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-900">
                    Select or enter sizes:
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-medium text-blue-500 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-medium text-blue-500 hover:text-blue-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Custom Size Input */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={handleCustomInputKeyDown}
                      placeholder="Enter custom size (e.g., 8.5, 9, 10)"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomOption}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Enter custom sizes like shoe sizes (8, 8.5, 9, 10.5) or any custom size
                  </p>
                </div>

                {/* Preset Size Options */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Quick Select (Clothing Sizes):</p>
                  <div className="grid grid-cols-4 gap-3">
                    {SIZE_OPTIONS.map((size) => (
                      <label
                        key={size}
                        className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedOptions.includes(size)
                            ? "border-blue-600 bg-blue-100 text-blue-900"
                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(size)}
                          onChange={() => handleOptionToggle(size)}
                          className="sr-only"
                        />
                        <span className="text-sm font-semibold">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Selected Options Display */}
                {selectedOptions.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded-md border border-blue-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      {selectedOptions.length} size{selectedOptions.length !== 1 ? 's' : ''} selected:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOptions.map((option) => (
                        <span
                          key={option}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {option}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(option)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Color Selection */}
            {variantType === "COLOR" && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-900">
                    Select or enter colors:
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-medium text-blue-500 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-medium text-blue-500 hover:text-blue-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Custom Color Input */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={handleCustomInputKeyDown}
                      placeholder="Enter custom color (e.g., Rose Gold, Teal)"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomOption}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Enter custom colors not in the preset list
                  </p>
                </div>

                {/* Preset Color Options */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Quick Select (Common Colors):</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {COLOR_OPTIONS.map((color) => (
                      <label
                        key={color.value}
                        className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedOptions.includes(color.label)
                            ? "border-blue-600 bg-blue-100"
                            : "border-gray-300 bg-white hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(color.label)}
                          onChange={() => handleOptionToggle(color.label)}
                          className="sr-only"
                        />
                        <div
                          className="w-10 h-10 rounded-full mb-2 border-2 border-gray-300 shadow-sm"
                          style={{
                            backgroundColor: color.hex,
                            border: color.value === "white" ? "2px solid #D1D5DB" : "2px solid transparent"
                          }}
                        />
                        <span className="text-xs font-medium text-gray-900 text-center">
                          {color.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Selected Options Display */}
                {selectedOptions.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded-md border border-blue-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      {selectedOptions.length} color{selectedOptions.length !== 1 ? 's' : ''} selected:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOptions.map((option) => (
                        <span
                          key={option}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {option}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(option)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generated Variants Table */}
            {fields.length > 0 && (
              <div className="mt-6">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Product Variants ({fields.length} total)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure details for each variant option
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Variant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          In Stock
                        </th>
                        {trackInventorySeparately && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Inventory
                          </th>
                        )}
                        {variantPricingEnabled && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Price
                          </th>
                        )}
                        {showSkuFields && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            SKU
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fields.map((field, index) => (
                        <tr key={field.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{field.name}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              {...register(`variants.${index}.inStock`)}
                              type="checkbox"
                              defaultChecked={field.inStock}
                              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          {trackInventorySeparately && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                {...register(`variants.${index}.inventoryQuantity`)}
                                type="number"
                                placeholder="0"
                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              />
                            </td>
                          )}
                          {variantPricingEnabled && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="relative w-24">
                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                  <span className="text-gray-500 text-sm">$</span>
                                </div>
                                <input
                                  {...register(`variants.${index}.price`)}
                                  type="text"
                                  placeholder="0.00"
                                  className="w-full pl-6 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                              </div>
                            </td>
                          )}
                          {showSkuFields && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                {...register(`variants.${index}.sku`)}
                                type="text"
                                placeholder="SKU"
                                className="w-28 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Advanced Options */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="flex items-center text-sm font-medium text-blue-500 hover:text-blue-800"
                  >
                    <svg
                      className={`h-4 w-4 mr-1 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Advanced Options
                  </button>

                  {showAdvancedOptions && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={variantPricingEnabled}
                          onChange={(e) => setVariantPricingEnabled(e.target.checked)}
                          className="h-4 w-4 mt-0.5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">Different prices for variants</span>
                          <p className="text-xs text-gray-500">Set a custom price for each variant</p>
                        </div>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={trackInventorySeparately}
                          onChange={(e) => setTrackInventorySeparately(e.target.checked)}
                          className="h-4 w-4 mt-0.5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">Track inventory separately</span>
                          <p className="text-xs text-gray-500">Set different inventory for each variant</p>
                        </div>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={showSkuFields}
                          onChange={(e) => setShowSkuFields(e.target.checked)}
                          className="h-4 w-4 mt-0.5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">Add SKUs for variants</span>
                          <p className="text-xs text-gray-500">Specify unique SKUs for each variant</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

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
