"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PRODUCT_CATEGORIES, getSubcategories } from "@/lib/categories"
import ImageUploadDropzone from "@/components/ImageUploadDropzone"

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.enum([
    "ACCESSORIES",
    "ART_AND_COLLECTIBLES",
    "BAGS_AND_PURSES",
    "BATH_AND_BEAUTY",
    "BOOKS_MOVIES_AND_MUSIC",
    "CLOTHING",
    "CRAFT_SUPPLIES_AND_TOOLS",
    "ELECTRONICS_AND_ACCESSORIES",
    "HOME_AND_LIVING",
    "JEWELRY",
    "PAPER_AND_PARTY_SUPPLIES",
    "PET_SUPPLIES",
    "SHOES",
    "TOYS_AND_GAMES",
    "WEDDINGS",
  ], {
    required_error: "Please select a category",
  }),
  subcategory: z.string().optional(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0),
  compareAtPrice: z.string().optional(),
  sku: z.string().optional(),
  trackInventory: z.boolean().default(true),
  inventoryQuantity: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]),
})

type ProductFormData = z.infer<typeof productSchema>

// CATEGORIES imported from lib/categories.ts

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "ARCHIVED", label: "Archived" },
]

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.id as string

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [editingVariant, setEditingVariant] = useState<any>(null)
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null)
  const [addingVariant, setAddingVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({ name: '', value: '', price: '', sku: '', quantity: '0' })

  // Product Addons State
  const [addons, setAddons] = useState<any[]>([])
  const [loadingAddons, setLoadingAddons] = useState(false)
  const [addingAddon, setAddingAddon] = useState(false)
  const [_editingAddon, _setEditingAddon] = useState<any>(null)
  const [deletingAddonId, setDeletingAddonId] = useState<string | null>(null)
  const [newAddon, setNewAddon] = useState({
    name: '',
    description: '',
    price: '',
    fieldType: 'TEXT',
    priceType: 'FIXED',
    isRequired: false,
    allowMultiple: false,
    maxQuantity: '',
    options: '[]',
    minValue: '',
    maxValue: '',
    sortOrder: '0'
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const trackInventory = watch("trackInventory")
  const selectedCategory = watch("category")

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch product")
      }

      const data = await response.json()
      setProduct(data.product)

      // Populate form
      setValue("name", data.product.name)
      setValue("description", data.product.description)
      setValue("category", data.product.category)
      setValue("subcategory", data.product.subcategory || "")
      setValue("price", data.product.price.toString())
      setValue("compareAtPrice", data.product.compareAtPrice?.toString() || "")
      setValue("sku", data.product.sku || "")
      setValue("trackInventory", data.product.trackInventory)
      setValue("inventoryQuantity", data.product.inventoryQuantity?.toString() || "")
      setValue("status", data.product.status)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product")
    } finally {
      setIsFetching(false)
    }
  }, [productId, setValue])

  useEffect(() => {
    fetchProduct()
    fetchAddons()
  }, [productId, fetchProduct, fetchAddons])

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return
    }

    setDeletingImageId(imageId)

    try {
      const response = await fetch(`/api/vendor/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete image")
      }

      // Refresh product to show updated images
      fetchProduct()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete image"}`)
    } finally {
      setDeletingImageId(null)
    }
  }

  const handleImagesSelected = (files: File[]) => {
    setNewImages(prev => [...prev, ...files])
  }

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadNewImages = async () => {
    if (newImages.length === 0) {return}

    setUploadingImages(true)

    try {
      const formData = new FormData()
      newImages.forEach(file => {
        formData.append("images", file)
      })

      const response = await fetch(`/api/vendor/products/${productId}/images`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload images")
      }

      // Clear new images and refresh product
      setNewImages([])
      fetchProduct()
      alert("Images uploaded successfully!")
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to upload images"}`)
    } finally {
      setUploadingImages(false)
    }
  }

  const handleUpdateVariant = async (variantId: string) => {
    if (!editingVariant) {return}

    try {
      const response = await fetch(`/api/vendor/products/${productId}/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingVariant.name,
          value: editingVariant.value,
          price: editingVariant.price ? parseFloat(editingVariant.price) : null,
          sku: editingVariant.sku || null,
          quantity: parseInt(editingVariant.quantity) || 0,
          available: editingVariant.available !== false,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update variant")
      }

      setEditingVariant(null)
      fetchProduct()
      alert("Variant updated successfully!")
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to update variant"}`)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) {return}

    setDeletingVariantId(variantId)

    try {
      const response = await fetch(`/api/vendor/products/${productId}/variants/${variantId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete variant")
      }

      fetchProduct()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete variant"}`)
    } finally {
      setDeletingVariantId(null)
    }
  }

  const handleAddVariant = async () => {
    if (!newVariant.name || !newVariant.value) {
      alert("Name and value are required")
      return
    }

    setAddingVariant(true)

    try {
      const response = await fetch(`/api/vendor/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVariant.name,
          value: newVariant.value,
          price: newVariant.price ? parseFloat(newVariant.price) : null,
          sku: newVariant.sku || null,
          quantity: parseInt(newVariant.quantity) || 0,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add variant")
      }

      setNewVariant({ name: '', value: '', price: '', sku: '', quantity: '0' })
      fetchProduct()
      alert("Variant added successfully!")
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to add variant"}`)
    } finally {
      setAddingVariant(false)
    }
  }

  // Product Addons Functions
  const fetchAddons = useCallback(async () => {
    setLoadingAddons(true)
    try {
      const response = await fetch(`/api/vendor/products/${productId}/addons`)
      if (response.ok) {
        const data = await response.json()
        setAddons(data.addons || [])
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch addons:", err)
    } finally {
      setLoadingAddons(false)
    }
  }, [productId])

  const handleAddAddon = async () => {
    if (!newAddon.name || !newAddon.price) {
      alert("Name and price are required")
      return
    }

    setAddingAddon(true)

    try {
      // Parse options if it's a string
      let parsedOptions = null
      if (['SELECT', 'RADIO', 'CHECKBOX', 'IMAGE_BUTTONS'].includes(newAddon.fieldType) && newAddon.options) {
        try {
          parsedOptions = JSON.parse(newAddon.options)
        } catch {
          alert("Invalid options format. Please use valid JSON array.")
          setAddingAddon(false)
          return
        }
      }

      const response = await fetch(`/api/vendor/products/${productId}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAddon.name,
          description: newAddon.description || null,
          price: parseFloat(newAddon.price),
          fieldType: newAddon.fieldType,
          priceType: newAddon.priceType,
          isRequired: newAddon.isRequired,
          allowMultiple: newAddon.allowMultiple,
          maxQuantity: newAddon.maxQuantity ? parseInt(newAddon.maxQuantity) : null,
          options: parsedOptions,
          minValue: newAddon.minValue ? parseFloat(newAddon.minValue) : null,
          maxValue: newAddon.maxValue ? parseFloat(newAddon.maxValue) : null,
          sortOrder: parseInt(newAddon.sortOrder),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add addon")
      }

      setNewAddon({
        name: '',
        description: '',
        price: '',
        fieldType: 'TEXT',
        priceType: 'FIXED',
        isRequired: false,
        allowMultiple: false,
        maxQuantity: '',
        options: '[]',
        minValue: '',
        maxValue: '',
        sortOrder: '0'
      })
      fetchAddons()
      alert("Addon added successfully!")
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to add addon"}`)
    } finally {
      setAddingAddon(false)
    }
  }

  const handleDeleteAddon = async (addonId: string) => {
    if (!confirm("Are you sure you want to delete this addon?")) {return}

    setDeletingAddonId(addonId)

    try {
      const response = await fetch(`/api/vendor/products/${productId}/addons/${addonId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete addon")
      }

      fetchAddons()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete addon"}`)
    } finally {
      setDeletingAddonId(null)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update product")
      }

      router.push("/dashboard/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="max-w-4xl">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-4xl">
        <div className="text-center py-12">
          <p className="text-red-600">Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update product information
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

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                {...register("status")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
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
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700">
                Compare at Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  {...register("compareAtPrice")}
                  type="text"
                  className="block w-full pl-7 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                SKU
              </label>
              <input
                {...register("sku")}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                />
              </div>
            )}
          </div>
        </div>

        {/* Product Images Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images</h2>

          {/* Current Images */}
          {product.product_images && product.product_images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Images ({product.product_images.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {product.product_images.map((image: any, index: number) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.altText || product.name}
                      className="h-32 w-full object-cover rounded-lg border-2 border-gray-200"
                    />
                    <div className="absolute top-1 right-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={deletingImageId === image.id}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Delete image"
                      >
                        {deletingImageId === image.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Images</h3>

            {/* File Input */}
            <div className="mb-4">
              <ImageUploadDropzone
                onImagesSelected={handleImagesSelected}
                maxImages={10}
                currentImageCount={existingImages.length + newImages.length}
              />
            </div>

            {/* Preview New Images */}
            {newImages.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ready to Upload ({newImages.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New image ${index + 1}`}
                        className="h-32 w-full object-cover rounded-lg border-2 border-green-500"
                      />
                      <div className="absolute top-1 right-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                        New
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleUploadNewImages}
                  disabled={uploadingImages}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingImages ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    `Upload ${newImages.length} Image${newImages.length > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Variants Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Product Variants {product.variants && product.variants.length > 0 && `(${product.variants.length})`}
          </h2>

          {/* Existing Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6 space-y-3">
              {product.variants.map((variant: any) => (
                <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                  {editingVariant?.id === variant.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editingVariant.name}
                            onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                          <input
                            type="text"
                            value={editingVariant.value}
                            onChange={(e) => setEditingVariant({ ...editingVariant, value: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="text"
                            value={editingVariant.price || ''}
                            onChange={(e) => setEditingVariant({ ...editingVariant, price: e.target.value })}
                            placeholder="Optional"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                          <input
                            type="text"
                            value={editingVariant.sku || ''}
                            onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                            placeholder="Optional"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={editingVariant.quantity}
                            onChange={(e) => setEditingVariant({ ...editingVariant, quantity: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingVariant(null)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateVariant(variant.id)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{variant.name}: {variant.value}</div>
                        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                          {variant.price && <span>${Number(variant.price).toFixed(2)}</span>}
                          {variant.sku && <span>SKU: {variant.sku}</span>}
                          <span>{variant.quantity} in stock</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingVariant({
                            id: variant.id,
                            name: variant.name,
                            value: variant.value,
                            price: variant.price?.toString() || '',
                            sku: variant.sku || '',
                            quantity: variant.quantity?.toString() || '0',
                            available: variant.available
                          })}
                          className="p-2 text-blue-600 hover:text-blue-800"
                          title="Edit variant"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant.id)}
                          disabled={deletingVariantId === variant.id}
                          className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Delete variant"
                        >
                          {deletingVariantId === variant.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Variant */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Variant</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newVariant.name}
                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    placeholder="e.g., Size, Color"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Value *</label>
                  <input
                    type="text"
                    value={newVariant.value}
                    onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })}
                    placeholder="e.g., Large, Red"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="text"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newVariant.quantity}
                    onChange={(e) => setNewVariant({ ...newVariant, quantity: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                disabled={addingVariant || !newVariant.name || !newVariant.value}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingVariant ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  "Add Variant"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Product Addons Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Product Addons (Add-ons & Customizations) {addons.length > 0 && `(${addons.length})`}
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Add customization options, upgrades, or add-ons that customers can select when purchasing this product.
          </p>

          {/* Existing Addons */}
          {loadingAddons ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Loading addons...</p>
            </div>
          ) : addons.length > 0 ? (
            <div className="mb-6 space-y-3">
              {addons.map((addon: any) => (
                <div key={addon.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{addon.name}</div>
                      {addon.description && (
                        <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
                        <span className="font-medium">
                          {addon.priceType === 'PERCENTAGE' ? `${addon.price}%` : `$${Number(addon.price).toFixed(2)}`}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          {addon.fieldType}
                        </span>
                        {addon.isRequired && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            Required
                          </span>
                        )}
                        {addon.allowMultiple && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            Multiple
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddon(addon.id)}
                      disabled={deletingAddonId === addon.id}
                      className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="Delete addon"
                    >
                      {deletingAddonId === addon.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg mb-6">
              <p className="text-gray-500">No addons yet. Add your first addon below.</p>
            </div>
          )}

          {/* Add New Addon */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Add New Addon</h3>
            <div className="space-y-4">
              {/* Name & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newAddon.name}
                    onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                    placeholder="e.g., Gift Wrapping, Express Shipping"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Field Type *</label>
                  <select
                    value={newAddon.fieldType}
                    onChange={(e) => setNewAddon({ ...newAddon, fieldType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="TEXT">Text Input</option>
                    <option value="TEXTAREA">Text Area</option>
                    <option value="NUMBER">Number</option>
                    <option value="SELECT">Dropdown Select</option>
                    <option value="CHECKBOX">Checkbox</option>
                    <option value="RADIO">Radio Buttons</option>
                    <option value="DATE">Date Picker</option>
                    <option value="FILE">File Upload</option>
                    <option value="COLOR">Color Picker</option>
                    <option value="IMAGE_BUTTONS">Image Buttons</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newAddon.description}
                  onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })}
                  placeholder="Optional description of this addon"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              {/* Price Configuration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price Type *</label>
                  <select
                    value={newAddon.priceType}
                    onChange={(e) => setNewAddon({ ...newAddon, priceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="FIXED">Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FORMULA">Formula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price * {newAddon.priceType === 'PERCENTAGE' && '(%)'}
                  </label>
                  <input
                    type="text"
                    value={newAddon.price}
                    onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={newAddon.sortOrder}
                    onChange={(e) => setNewAddon({ ...newAddon, sortOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* Options for SELECT, RADIO, CHECKBOX, IMAGE_BUTTONS */}
              {['SELECT', 'RADIO', 'CHECKBOX', 'IMAGE_BUTTONS'].includes(newAddon.fieldType) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Options (JSON array) *
                  </label>
                  <textarea
                    value={newAddon.options}
                    onChange={(e) => setNewAddon({ ...newAddon, options: e.target.value })}
                    placeholder='[{"label": "Option 1", "value": "opt1", "price": 0}, {"label": "Option 2", "value": "opt2", "price": 5}]'
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a JSON array of options. Each option should have &quot;label&quot;, &quot;value&quot;, and optional &quot;price&quot;.
                  </p>
                </div>
              )}

              {/* Min/Max for NUMBER */}
              {newAddon.fieldType === 'NUMBER' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Value</label>
                    <input
                      type="text"
                      value={newAddon.minValue}
                      onChange={(e) => setNewAddon({ ...newAddon, minValue: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Value</label>
                    <input
                      type="text"
                      value={newAddon.maxValue}
                      onChange={(e) => setNewAddon({ ...newAddon, maxValue: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Checkboxes */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAddon.isRequired}
                    onChange={(e) => setNewAddon({ ...newAddon, isRequired: e.target.checked })}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAddon.allowMultiple}
                    onChange={(e) => setNewAddon({ ...newAddon, allowMultiple: e.target.checked })}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow Multiple</span>
                </label>
                {newAddon.allowMultiple && (
                  <div className="flex items-center">
                    <label className="text-sm text-gray-700 mr-2">Max Quantity:</label>
                    <input
                      type="number"
                      value={newAddon.maxQuantity}
                      onChange={(e) => setNewAddon({ ...newAddon, maxQuantity: e.target.value })}
                      placeholder="Optional"
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddAddon}
                disabled={addingAddon || !newAddon.name || !newAddon.price}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingAddon ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Addon...
                  </span>
                ) : (
                  "Add Addon"
                )}
              </button>
            </div>
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
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
