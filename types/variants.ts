/**
 * TypeScript Type Definitions for Enhanced Variant System
 *
 * These types support multi-dimensional variants (Size + Color + Material, etc.)
 * for a multi-category marketplace where vendors can sell anything.
 */

// ============================================
// VARIANT OPTION TYPES
// ============================================

/**
 * Types of variant options available
 */
export type VariantOptionType =
  | 'SIZE'
  | 'COLOR'
  | 'MATERIAL'
  | 'STYLE'
  | 'FINISH'
  | 'FORMAT'
  | 'CUSTOM'

/**
 * Single variant option value (e.g., "Large", "Red", "Sterling Silver")
 */
export interface VariantOption {
  id: string
  productId: string
  type: VariantOptionType
  value: string // The actual option value (e.g., "Large", "Red")
  displayName: string // How to display it (e.g., "Large", "Red")

  // Visual representation
  hexColor?: string // For color options
  imageUrl?: string // For options with images (colors, materials, etc.)
  icon?: string // Emoji or icon identifier

  // Metadata
  description?: string
  sortOrder: number
  isActive: boolean

  createdAt: Date
  updatedAt: Date
}

/**
 * A complete variant combination (e.g., "Size: Large, Color: Red, Material: Cotton")
 */
export interface ProductVariantCombination {
  id: string
  productId: string

  // Combination identification
  combinationKey: string // "SIZE:Large|COLOR:Red|MATERIAL:Cotton"
  optionValues: Record<string, string> // { "SIZE": "Large", "COLOR": "Red", "MATERIAL": "Cotton" }

  // Variant-specific details
  sku?: string
  price?: number // If null, uses product base price
  compareAtPrice?: number

  // Inventory
  quantity: number
  inventoryTracked: boolean
  lowStockThreshold?: number

  // Availability
  available: boolean
  inStock: boolean // Computed based on quantity

  // Visual
  imageUrl?: string // Specific image for this combination

  // Metadata
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// ============================================
// PRODUCT VARIANT CONFIGURATION
// ============================================

/**
 * Product's variant configuration
 */
export interface ProductVariantConfig {
  productId: string
  hasVariants: boolean

  // Multi-variant support
  variantTypes: VariantOptionType[] // e.g., ["SIZE", "COLOR", "MATERIAL"]

  // All available options per type
  options: Record<string, VariantOption[]> // { "SIZE": [...], "COLOR": [...] }

  // All generated combinations
  combinations: ProductVariantCombination[]

  // Pricing settings
  useVariantPricing: boolean // If true, each combination can have own price
  basePriceAppliesTo: 'all' | 'no-override' // How base product price is used

  // Inventory settings
  trackInventorySeparately: boolean // Track inventory per combination
}

// ============================================
// PRODUCT ADD-ONS
// ============================================

/**
 * Add-on that customers can select (gift wrap, engraving, etc.)
 */
export interface ProductAddon {
  id: string
  productId?: string // If null, it's a store-wide addon
  storeId: string

  // Add-on details
  name: string
  description?: string
  price: number

  // Behavior
  isRequired: boolean // Must be selected
  allowMultiple: boolean // Can select multiple times (e.g., multiple gift wraps)
  maxQuantity?: number

  // Conditional logic
  requiredForVariants?: string[] // Only available for specific variant combinations
  excludedForVariants?: string[] // Not available for specific combinations

  // Metadata
  imageUrl?: string
  icon?: string
  sortOrder: number
  isActive: boolean

  createdAt: Date
  updatedAt: Date
}

// ============================================
// CART & ORDER INTEGRATION
// ============================================

/**
 * Selected variant information for cart/order item
 */
export interface SelectedVariant {
  productId: string
  combinationId: string
  combinationKey: string

  // Human-readable selection
  options: Array<{
    type: VariantOptionType
    typeName: string // "Size", "Color", etc.
    value: string
    displayValue: string
  }>

  // Pricing
  price: number

  // Visual
  imageUrl?: string
}

/**
 * Selected addon for cart/order item
 */
export interface SelectedAddon {
  addonId: string
  name: string
  price: number
  quantity: number
}

/**
 * Complete cart item with variants and addons
 */
export interface CartItemWithVariants {
  id: string
  productId: string
  productName: string
  productSlug: string

  // Variant selection
  variant?: SelectedVariant

  // Add-on selections
  addons: SelectedAddon[]

  // Pricing
  basePrice: number
  variantPrice?: number
  addonsTotalPrice: number
  totalPrice: number // base + variant + addons

  // Quantity
  quantity: number

  // Store info
  storeId: string
  storeSlug: string
  storeName: string

  // Images
  mainImageUrl?: string
  variantImageUrl?: string
}

// ============================================
// WIZARD FORM DATA
// ============================================

/**
 * Form data for product creation wizard
 */
export interface ProductVariantWizardData {
  // Step 1: Product type
  hasVariants: boolean

  // Step 2: Variant types selection
  selectedVariantTypes: VariantOptionType[]

  // Step 3: Options per type
  variantOptions: Record<VariantOptionType, {
    useTemplate?: string // Template ID if using preset
    customOptions: string[] // Custom option values
    selectedPresetOptions: string[] // Selected from preset
  }>

  // Step 4: Bulk settings
  bulkSettings: {
    applyDefaultPrice: boolean
    defaultPrice?: number
    applyDefaultInventory: boolean
    defaultInventory?: number
    generateSkus: boolean
    skuPattern?: string // e.g., "PROD-{SIZE}-{COLOR}"
  }

  // Step 5: Individual variant overrides (optional)
  variantOverrides: Record<string, { // Key is combinationKey
    price?: number
    sku?: string
    quantity?: number
    available?: boolean
    imageUrl?: string
  }>

  // Add-ons
  addons: Array<{
    name: string
    description?: string
    price: number
    isRequired: boolean
  }>
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * Request to create variant combinations
 */
export interface CreateVariantCombinationsRequest {
  productId: string
  variantTypes: VariantOptionType[]

  // Options per type
  options: Array<{
    type: VariantOptionType
    values: Array<{
      value: string
      displayName?: string
      hexColor?: string
      imageUrl?: string
      icon?: string
    }>
  }>

  // Auto-generate all combinations?
  generateCombinations: boolean

  // Default values for combinations
  defaults?: {
    price?: number
    quantity?: number
    sku?: string
  }
}

/**
 * Response from creating combinations
 */
export interface CreateVariantCombinationsResponse {
  success: boolean
  created: number // Number of combinations created
  combinations: ProductVariantCombination[]
  message: string
}

/**
 * Request to bulk update variants
 */
export interface BulkUpdateVariantsRequest {
  productId: string

  // Filter criteria (which variants to update)
  filter?: {
    type?: VariantOptionType
    value?: string
    combinationKeys?: string[]
  }

  // Updates to apply
  updates: {
    price?: number
    quantity?: number
    available?: boolean
    sku?: string
  }
}

/**
 * Response from bulk update
 */
export interface BulkUpdateVariantsResponse {
  success: boolean
  updated: number // Number of variants updated
  message: string
}

// ============================================
// UI COMPONENT PROPS TYPES
// ============================================

/**
 * Props for variant selector component (customer-facing)
 */
export interface VariantSelectorProps {
  product: {
    id: string
    name: string
    basePrice: number
    images: Array<{ url: string; altText?: string }>
  }

  variantConfig: ProductVariantConfig
  addons: ProductAddon[]

  // Callbacks
  onVariantSelected: (combination: ProductVariantCombination) => void
  onAddonsChanged: (addons: SelectedAddon[]) => void
  onPriceCalculated: (totalPrice: number) => void

  // UI options
  showOutOfStock?: boolean
  allowBackorder?: boolean
}

/**
 * Props for variant option selector (Size, Color, etc.)
 */
export interface VariantOptionSelectorProps {
  type: VariantOptionType
  options: VariantOption[]
  selectedValue?: string

  // Availability per option
  availability: Record<string, {
    available: boolean
    inStock: boolean
    quantity?: number
  }>

  // Visual display mode
  displayMode?: 'buttons' | 'swatches' | 'dropdown' | 'grid'

  // Callbacks
  onChange: (value: string) => void

  // UI options
  showQuantity?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Props for variant wizard component (vendor-facing)
 */
export interface VariantWizardProps {
  productId?: string // If editing existing product
  productCategory: string // Product category for relevant templates

  initialData?: Partial<ProductVariantWizardData>

  // Callbacks
  onComplete: (data: ProductVariantWizardData) => Promise<void>
  onCancel: () => void
  onSaveDraft?: (data: Partial<ProductVariantWizardData>) => Promise<void>
}

// ============================================
// VALIDATION TYPES
// ============================================

/**
 * Validation result for variant configuration
 */
export interface VariantValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  warnings: Array<{
    field: string
    message: string
    quickFix?: () => void
  }>
}

// ============================================
// ANALYTICS & REPORTING TYPES
// ============================================

/**
 * Variant performance metrics
 */
export interface VariantPerformanceMetrics {
  productId: string

  // Per combination
  combinations: Array<{
    combinationKey: string
    optionValues: Record<string, string>

    // Sales metrics
    unitsSold: number
    revenue: number
    conversionRate: number

    // Inventory metrics
    currentStock: number
    stockTurnoverRate: number
    daysOutOfStock: number
  }>

  // Top performers
  topCombinations: string[] // combinationKeys
  worstCombinations: string[]

  // Recommendations
  recommendations: Array<{
    type: 'restock' | 'discontinue' | 'price-adjust'
    combinationKey: string
    message: string
  }>
}

// ============================================
// EXPORT ALL TYPES
// ============================================

// Note: All types are already exported inline above
// No need for duplicate exports
