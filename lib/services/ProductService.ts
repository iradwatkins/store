/**
 * Product Service
 * 
 * Contains business logic for product management
 * Separates concerns from API routes and UI components
 */

import { ProductRepository } from '@/lib/repositories/ProductRepository'
import { 
  Product, 
  ProductStatus, 
  ProductCategory,
  OperationResult,
  QuotaCheck
} from '@/lib/domain/types'
import { logger } from '@/lib/logger'
import { invalidateProductCache, invalidateVendorCache } from '@/lib/cache'
import {
  validateImage,
  generateImageSizes,
  productImageSizes,
  calculateCompressionRatio
} from '@/lib/image-optimizer'
import { storageHelpers } from '@/lib/storage'
import prisma from '@/lib/db'

export interface CreateProductData {
  name: string
  description: string
  category: ProductCategory
  subcategory?: string | null
  price: number
  compareAtPrice?: number | null
  sku?: string | null
  trackInventory: boolean
  quantity: number
  
  // Variant system
  hasVariants: boolean
  variantType?: string | null
  useMultiVariants: boolean
  variantTypes: string[]
  
  // Legacy support
  variants?: any[]
  variantOptions?: any
  generateCombinations?: boolean
}

export interface ProductQuotaInfo {
  currentProducts: number
  maxProducts: number
  currentStorageGB: number
  maxStorageGB: number
}

export interface ProductImageUpload {
  file: File
  buffer: Buffer
}

export class ProductService {
  private productRepo: ProductRepository

  constructor() {
    this.productRepo = new ProductRepository()
  }

  /**
   * Check if store can create a new product (quota validation)
   */
  async checkProductQuota(storeId: string): Promise<QuotaCheck> {
    try {
      const store = await prisma.vendorStore.findUnique({
        where: { id: storeId },
        include: { Tenant: true }
      })

      if (!store?.Tenant) {
        // No tenant restrictions
        return {
          allowed: true,
          currentUsage: 0,
          limit: Infinity,
          remaining: Infinity
        }
      }

      const tenant = store.Tenant
      const remaining = tenant.maxProducts - tenant.currentProducts

      return {
        allowed: tenant.currentProducts < tenant.maxProducts,
        currentUsage: tenant.currentProducts,
        limit: tenant.maxProducts,
        remaining,
        upgradeRequired: remaining <= 0
      }
    } catch (error) {
      logger.error('Error checking product quota', { storeId, error })
      throw new Error('Failed to check product quota')
    }
  }

  /**
   * Check storage quota for image uploads
   */
  async checkStorageQuota(
    storeId: string, 
    additionalSizeGB: number
  ): Promise<QuotaCheck> {
    try {
      const store = await prisma.vendorStore.findUnique({
        where: { id: storeId },
        include: { Tenant: true }
      })

      if (!store?.Tenant) {
        return {
          allowed: true,
          currentUsage: 0,
          limit: Infinity,
          remaining: Infinity
        }
      }

      const tenant = store.Tenant
      const newTotal = Number(tenant.currentStorageGB) + additionalSizeGB
      const remaining = Number(tenant.maxStorageGB) - Number(tenant.currentStorageGB)

      return {
        allowed: newTotal <= Number(tenant.maxStorageGB),
        currentUsage: Number(tenant.currentStorageGB),
        limit: Number(tenant.maxStorageGB),
        remaining,
        upgradeRequired: additionalSizeGB > remaining
      }
    } catch (error) {
      logger.error('Error checking storage quota', { storeId, error })
      throw new Error('Failed to check storage quota')
    }
  }

  /**
   * Generate unique product slug
   */
  async generateProductSlug(storeId: string, name: string, excludeId?: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    let slug = baseSlug
    let counter = 1

    // Check if slug exists and generate unique one
    while (await this.productRepo.existsBySlug(storeId, slug, excludeId)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }

  /**
   * Process and upload product images
   */
  async processProductImages(
    storeId: string,
    productId: string,
    images: ProductImageUpload[]
  ): Promise<OperationResult<{ uploadedSizeGB: number; imageCount: number }>> {
    try {
      let totalUploadedSizeGB = 0

      for (let i = 0; i < images.length; i++) {
        const { file, buffer } = images[i]

        // Validate image
        const validation = await validateImage(buffer)
        if (!validation.valid) {
          return {
            success: false,
            error: `Image validation failed: ${validation.error}`
          }
        }

        // Generate optimized image sizes
        const optimizedSizes = await generateImageSizes(buffer, productImageSizes, {
          quality: 85,
          format: 'webp'
        })

        // Upload all sizes to storage
        const imageUrls: Record<string, string> = {}
        for (const [sizeName, optimizedImage] of Object.entries(optimizedSizes)) {
          const timestamp = Date.now()
          const path = `products/${storeId}/${productId}/${timestamp}-${sizeName}.webp`

          const imageUrl = await storageHelpers.uploadFile(
            optimizedImage.buffer,
            path,
            'image/webp'
          )
          imageUrls[sizeName] = imageUrl
        }

        // Log compression stats
        const originalSize = buffer.length
        const optimizedSize = optimizedSizes.large.size
        const savings = calculateCompressionRatio(originalSize, optimizedSize)
        
        logger.info("Image optimized", { 
          fileName: file.name, 
          savedPercent: savings.savedPercent, 
          savedBytes: savings.savedBytes 
        })

        // Track total uploaded size
        const allSizesTotal = Object.values(optimizedSizes).reduce((sum, img) => sum + img.size, 0)
        totalUploadedSizeGB += allSizesTotal / (1024 * 1024 * 1024)

        // Create ProductImage record
        await prisma.productImage.create({
          data: {
            productId,
            url: imageUrls.large,
            thumbnail: imageUrls.thumbnail,
            medium: imageUrls.medium,
            large: imageUrls.large,
            altText: `${file.name} image`,
            sortOrder: i
          }
        })
      }

      // Update tenant storage usage
      if (totalUploadedSizeGB > 0) {
        await this.updateStorageUsage(storeId, totalUploadedSizeGB)
      }

      return {
        success: true,
        data: {
          uploadedSizeGB: totalUploadedSizeGB,
          imageCount: images.length
        }
      }
    } catch (error) {
      logger.error('Error processing product images', { storeId, productId, error })
      return {
        success: false,
        error: 'Failed to process product images'
      }
    }
  }

  /**
   * Create product with variants
   */
  async createProduct(
    storeId: string,
    productData: CreateProductData,
    images: ProductImageUpload[] = []
  ): Promise<OperationResult<Product>> {
    try {
      // Check quotas
      const productQuota = await this.checkProductQuota(storeId)
      if (!productQuota.allowed) {
        return {
          success: false,
          error: `Product limit reached (${productQuota.limit}). Please upgrade your plan.`,
          warnings: ['Upgrade required to add more products']
        }
      }

      if (images.length > 0) {
        const totalImageSize = images.reduce((sum, img) => sum + img.buffer.length, 0) / (1024 * 1024 * 1024)
        const storageQuota = await this.checkStorageQuota(storeId, totalImageSize)
        
        if (!storageQuota.allowed) {
          return {
            success: false,
            error: `Storage limit exceeded. Current: ${storageQuota.currentUsage}GB, Limit: ${storageQuota.limit}GB`,
            warnings: ['Upgrade required for additional storage']
          }
        }
      }

      // Generate unique slug
      const slug = await this.generateProductSlug(storeId, productData.name)

      // Create product
      const product = await this.productRepo.create({
        vendorStoreId: storeId,
        name: productData.name,
        slug,
        description: productData.description,
        category: productData.category,
        subcategory: productData.subcategory,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        sku: productData.sku,
        trackInventory: productData.trackInventory,
        quantity: productData.hasVariants ? 0 : productData.quantity, // Variants track their own inventory
        status: ProductStatus.DRAFT,
        hasVariants: productData.hasVariants,
        variantType: productData.variantType as any,
        useMultiVariants: productData.useMultiVariants,
        variantTypes: productData.variantTypes
      })

      // Handle variants if needed
      if (productData.hasVariants) {
        await this.createProductVariants(product.id, productData)
      }

      // Process images
      if (images.length > 0) {
        const imageResult = await this.processProductImages(storeId, product.id, images)
        if (!imageResult.success) {
          logger.warn('Product created but image processing failed', { 
            productId: product.id, 
            error: imageResult.error 
          })
        }
      }

      // Update quotas
      await this.incrementProductCount(storeId)

      // Invalidate caches
      await Promise.all([
        invalidateProductCache(product.id, storeId),
        invalidateVendorCache(storeId)
      ])

      logger.info('Product created successfully', { 
        productId: product.id, 
        storeId, 
        name: product.name 
      })

      return {
        success: true,
        data: product
      }
    } catch (error) {
      logger.error('Error creating product', { storeId, productData, error })
      return {
        success: false,
        error: 'Failed to create product'
      }
    }
  }

  /**
   * Create product variants (old and new system)
   */
  private async createProductVariants(productId: string, productData: CreateProductData): Promise<void> {
    if (productData.useMultiVariants && productData.variantOptions && productData.generateCombinations) {
      // New multi-variant system - call combinations API
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/vendor/products/${productId}/variants/combinations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantTypes: productData.variantTypes,
            options: productData.variantOptions,
            generateCombinations: true,
            defaults: { quantity: 0, price: null }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create variant combinations')
        }
      } catch (error) {
        logger.error('Error creating variant combinations', { productId, error })
        // Continue without variants rather than failing
      }
    } else if (productData.variants) {
      // Old variant system
      for (const variant of productData.variants) {
        await prisma.productVariant.create({
          data: {
            productId,
            name: variant.name,
            value: variant.name,
            sku: variant.sku || null,
            price: variant.price ? parseFloat(variant.price) : null,
            quantity: variant.inventoryQuantity ? parseInt(variant.inventoryQuantity) : 0
          }
        })
      }
    }
  }

  /**
   * Update storage usage for tenant
   */
  private async updateStorageUsage(storeId: string, additionalGB: number): Promise<void> {
    const store = await prisma.vendorStore.findUnique({
      where: { id: storeId },
      select: { tenantId: true }
    })

    if (store?.tenantId) {
      await prisma.tenant.update({
        where: { id: store.tenantId },
        data: {
          currentStorageGB: { increment: additionalGB }
        }
      })
    }
  }

  /**
   * Increment product count for tenant
   */
  private async incrementProductCount(storeId: string): Promise<void> {
    const store = await prisma.vendorStore.findUnique({
      where: { id: storeId },
      select: { tenantId: true }
    })

    if (store?.tenantId) {
      await prisma.tenant.update({
        where: { id: store.tenantId },
        data: { currentProducts: { increment: 1 } }
      })
    }
  }

  /**
   * Update product status
   */
  async updateProductStatus(
    storeId: string,
    productId: string,
    status: ProductStatus
  ): Promise<OperationResult<Product>> {
    try {
      const product = await this.productRepo.findFirst({
        id: productId,
        vendorStoreId: storeId
      })

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        }
      }

      const updatedProduct = await this.productRepo.update(productId, { status })

      await invalidateProductCache(productId, storeId)

      logger.info('Product status updated', { productId, status })

      return {
        success: true,
        data: updatedProduct
      }
    } catch (error) {
      logger.error('Error updating product status', { productId, status, error })
      return {
        success: false,
        error: 'Failed to update product status'
      }
    }
  }

  /**
   * Duplicate product
   */
  async duplicateProduct(
    storeId: string,
    productId: string,
    newName: string
  ): Promise<OperationResult<Product>> {
    try {
      const quotaCheck = await this.checkProductQuota(storeId)
      if (!quotaCheck.allowed) {
        return {
          success: false,
          error: `Product limit reached (${quotaCheck.limit}). Please upgrade your plan.`
        }
      }

      const newSlug = await this.generateProductSlug(storeId, newName)
      const duplicatedProduct = await this.productRepo.duplicateProduct(productId, newName, newSlug)

      await this.incrementProductCount(storeId)
      await invalidateVendorCache(storeId)

      return {
        success: true,
        data: duplicatedProduct
      }
    } catch (error) {
      logger.error('Error duplicating product', { productId, newName, error })
      return {
        success: false,
        error: 'Failed to duplicate product'
      }
    }
  }
}