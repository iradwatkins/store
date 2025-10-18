/**
 * Domain Types - Core Business Entities
 * 
 * Centralized type definitions for business domain
 * Reduces type duplication across the application
 */

// Base Entity Types
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: Date | null
}

// User & Authentication
export interface User extends BaseEntity {
  email: string
  name?: string | null
  role: UserRole
  emailVerified?: Date | null
  image?: string | null
}

export enum UserRole {
  USER = 'USER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Tenant & Store Management
export interface Tenant extends BaseEntity {
  name: string
  slug: string
  domain?: string | null
  customDomain?: string | null
  currentProducts: number
  maxProducts: number
  currentStorageGB: number
  maxStorageGB: number
  planType: PlanType
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  subscriptionStatus: SubscriptionStatus
}

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID'
}

export interface VendorStore extends BaseEntity {
  userId: string
  tenantId?: string | null
  name: string
  slug: string
  description?: string | null
  logo?: string | null
  bannerImage?: string | null
  isActive: boolean
  settings: StoreSettings
}

export interface StoreSettings {
  currency: string
  allowReviews: boolean
  requireEmailVerification: boolean
  enableInventoryTracking: boolean
  lowStockThreshold: number
  taxIncluded: boolean
  defaultTaxRate: number
  shippingZones: ShippingZone[]
  paymentMethods: PaymentMethod[]
}

// Product Management
export interface Product extends BaseEntity {
  vendorStoreId: string
  name: string
  slug: string
  description: string
  category: ProductCategory
  subcategory?: string | null
  price: number
  compareAtPrice?: number | null
  sku?: string | null
  trackInventory: boolean
  quantity: number
  status: ProductStatus
  hasVariants: boolean
  variantType?: VariantType | null
  useMultiVariants: boolean
  variantTypes: string[]
  weight?: number | null
  dimensions?: ProductDimensions | null
  seoTitle?: string | null
  seoDescription?: string | null
}

export enum ProductCategory {
  ACCESSORIES = 'ACCESSORIES',
  ART_AND_COLLECTIBLES = 'ART_AND_COLLECTIBLES',
  BAGS_AND_PURSES = 'BAGS_AND_PURSES',
  BATH_AND_BEAUTY = 'BATH_AND_BEAUTY',
  BOOKS_MOVIES_AND_MUSIC = 'BOOKS_MOVIES_AND_MUSIC',
  CLOTHING = 'CLOTHING',
  CRAFT_SUPPLIES_AND_TOOLS = 'CRAFT_SUPPLIES_AND_TOOLS',
  ELECTRONICS_AND_ACCESSORIES = 'ELECTRONICS_AND_ACCESSORIES',
  HOME_AND_LIVING = 'HOME_AND_LIVING',
  JEWELRY = 'JEWELRY',
  PAPER_AND_PARTY_SUPPLIES = 'PAPER_AND_PARTY_SUPPLIES',
  PET_SUPPLIES = 'PET_SUPPLIES',
  SHOES = 'SHOES',
  TOYS_AND_GAMES = 'TOYS_AND_GAMES',
  WEDDINGS = 'WEDDINGS'
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum VariantType {
  NONE = 'NONE',
  SIZE = 'SIZE',
  COLOR = 'COLOR'
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'in'
}

export interface ProductImage extends BaseEntity {
  productId: string
  url: string
  thumbnail?: string | null
  medium?: string | null
  large?: string | null
  altText?: string | null
  sortOrder: number
}

export interface ProductVariant extends BaseEntity {
  productId: string
  name: string
  value: string
  sku?: string | null
  price?: number | null
  quantity: number
  isActive: boolean
}

// Multi-Variant System
export interface ProductVariantCombination extends BaseEntity {
  productId: string
  combinationKey: string
  optionValues: Record<string, string>
  sku?: string | null
  price?: number | null
  compareAtPrice?: number | null
  quantity: number
  available: boolean
  sortOrder: number
  imageUrl?: string | null
}

// Order Management
export interface Order extends BaseEntity {
  orderNumber: string
  vendorStoreId: string
  customerEmail: string
  customerName?: string | null
  subtotal: number
  shippingCost: number
  taxAmount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  shippingAddress: Address
  billingAddress?: Address | null
  fulfillmentStatus: FulfillmentStatus
  trackingNumber?: string | null
  notes?: string | null
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum FulfillmentStatus {
  UNFULFILLED = 'UNFULFILLED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED'
}

export interface OrderItem extends BaseEntity {
  orderId: string
  productId: string
  variantId?: string | null
  variantCombinationId?: string | null
  name: string
  sku?: string | null
  quantity: number
  price: number
  total: number
}

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string | null
}

// Shipping & Payment
export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  regions?: string[]
  rates: ShippingRate[]
}

export interface ShippingRate {
  id: string
  name: string
  description?: string
  price: number
  estimatedDays?: number
  freeShippingThreshold?: number
}

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  name: string
  isEnabled: boolean
  configuration: Record<string, any>
}

export enum PaymentMethodType {
  STRIPE = 'STRIPE',
  SQUARE = 'SQUARE',
  PAYPAL = 'PAYPAL',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

// Reviews & Ratings
export interface Review extends BaseEntity {
  productId: string
  orderId?: string | null
  customerEmail: string
  customerName?: string | null
  rating: number
  title?: string | null
  content?: string | null
  verified: boolean
  helpful: number
  notHelpful: number
  status: ReviewStatus
  response?: ReviewResponse | null
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED'
}

export interface ReviewResponse {
  content: string
  authorName: string
  createdAt: Date
}

// Coupons & Discounts
export interface Coupon extends BaseEntity {
  vendorStoreId: string
  code: string
  name: string
  description?: string | null
  type: CouponType
  value: number
  minimumOrderAmount?: number | null
  usageLimit?: number | null
  usageCount: number
  validFrom: Date
  validUntil?: Date | null
  isActive: boolean
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING'
}

// Common Filter and Pagination Types
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FilterParams {
  search?: string
  category?: ProductCategory
  status?: ProductStatus | OrderStatus | ReviewStatus
  dateFrom?: Date
  dateTo?: Date
  priceMin?: number
  priceMax?: number
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

// Business Logic Result Types
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
}

export interface QuotaCheck {
  allowed: boolean
  currentUsage: number
  limit: number
  remaining: number
  upgradeRequired?: boolean
}

// Event Types for Domain Events
export interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  data: any
  timestamp: Date
  version: number
}

export interface ProductCreatedEvent extends DomainEvent {
  type: 'ProductCreated'
  data: {
    productId: string
    storeId: string
    name: string
    category: ProductCategory
  }
}

export interface OrderPlacedEvent extends DomainEvent {
  type: 'OrderPlaced'
  data: {
    orderId: string
    storeId: string
    customerEmail: string
    total: number
    items: OrderItem[]
  }
}

export interface InventoryUpdatedEvent extends DomainEvent {
  type: 'InventoryUpdated'
  data: {
    productId: string
    variantId?: string
    previousQuantity: number
    newQuantity: number
    reason: 'sale' | 'restock' | 'adjustment'
  }
}