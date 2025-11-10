/**
 * Product Repository
 * 
 * Handles all product-related data access operations
 * Implements the repository pattern for product management
 */

import prisma from '@/lib/db'
import { 
  Product, 
  ProductStatus, 
  ProductCategory, 
  PaginationParams, 
  PaginationResult, 
  FilterParams 
} from '@/lib/domain/types'
import { BaseRepository } from './BaseRepository'

export interface ProductFilters extends FilterParams {
  storeId?: string
  category?: ProductCategory
  status?: ProductStatus
  hasVariants?: boolean
  lowStock?: boolean
  priceMin?: number
  priceMax?: number
}

export interface ProductWithRelations extends Product {
  images?: any[]
  variants?: any[]
  variantCombinations?: any[]
  _count?: {
    orderItems: number
    reviews: number
  }
}

export class ProductRepository extends BaseRepository<Product> {
  protected model = prisma.products
  protected entityName = 'Product'

  /**
   * Find products by store ID with pagination and filters
   */
  async findByStore(
    storeId: string,
    pagination: PaginationParams,
    filters: Omit<ProductFilters, 'storeId'> = {}
  ): Promise<PaginationResult<ProductWithRelations>> {
    const where = this.buildProductFilterClause({ ...filters, storeId })
    
    return this.findMany(where, pagination, {
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1
        },
        variants: true,
        variantCombinations: true,
        _count: {
          select: {
            orderItems: true,
            reviews: true
          }
        }
      }
    })
  }

  /**
   * Find active products for storefront
   */
  async findActiveProducts(
    storeId: string,
    pagination: PaginationParams,
    filters: ProductFilters = {}
  ): Promise<PaginationResult<ProductWithRelations>> {
    const where = this.buildProductFilterClause({
      ...filters,
      storeId,
      status: ProductStatus.ACTIVE
    })

    return this.findMany(where, pagination, {
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true }
        },
        variantCombinations: {
          where: { available: true }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })
  }

  /**
   * Find product by slug for storefront
   */
  async findBySlug(
    storeId: string,
    slug: string,
    includeInactive = false
  ): Promise<ProductWithRelations | null> {
    const where: any = {
      vendorStoreId: storeId,
      slug
    }

    if (!includeInactive) {
      where.status = ProductStatus.ACTIVE
    }

    return this.findFirst(where, {
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: includeInactive ? {} : { isActive: true }
        },
        variantCombinations: {
          where: includeInactive ? {} : { available: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
  }

  /**
   * Find low stock products
   */
  async findLowStockProducts(storeId: string): Promise<ProductWithRelations[]> {
    return this.findAll({
      vendorStoreId: storeId,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      OR: [
        {
          hasVariants: false,
          quantity: { lte: 5, gt: 0 }
        },
        {
          hasVariants: true,
          OR: [
            {
              variants: {
                some: {
                  quantity: { lte: 5, gt: 0 }
                }
              }
            },
            {
              variantCombinations: {
                some: {
                  quantity: { lte: 5, gt: 0 }
                }
              }
            }
          ]
        }
      ]
    }, {
      include: {
        images: { take: 1 },
        variants: {
          where: { quantity: { lte: 5, gt: 0 } }
        },
        variantCombinations: {
          where: { quantity: { lte: 5, gt: 0 } }
        }
      }
    })
  }

  /**
   * Check if product name/slug exists in store
   */
  async existsBySlug(storeId: string, slug: string, excludeId?: string): Promise<boolean> {
    const where: any = {
      vendorStoreId: storeId,
      slug
    }

    if (excludeId) {
      where.id = { not: excludeId }
    }

    return this.exists(where)
  }

  /**
   * Update product inventory
   */
  async updateInventory(
    productId: string,
    quantityChange: number,
    variantId?: string
  ): Promise<void> {
    await this.transaction(async (tx) => {
      if (variantId) {
        // Update variant inventory
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            quantity: {
              increment: quantityChange
            }
          }
        })
      } else {
        // Update product inventory
        await tx.product.update({
          where: { id: productId },
          data: {
            quantity: {
              increment: quantityChange
            }
          }
        })
      }
    })
  }

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(
    storeId: string,
    productIds: string[],
    status: ProductStatus
  ): Promise<{ count: number }> {
    return this.updateMany({
      id: { in: productIds },
      vendorStoreId: storeId
    }, { status })
  }

  /**
   * Get product analytics
   */
  async getAnalytics(storeId: string): Promise<{
    totalProducts: number
    activeProducts: number
    draftProducts: number
    lowStockCount: number
    outOfStockCount: number
    totalValue: number
  }> {
    const [
      totalProducts,
      activeProducts,
      draftProducts,
      lowStockProducts,
      outOfStockProducts,
      productValues
    ] = await Promise.all([
      this.count({ vendorStoreId: storeId }),
      this.count({ vendorStoreId: storeId, status: ProductStatus.ACTIVE }),
      this.count({ vendorStoreId: storeId, status: ProductStatus.DRAFT }),
      this.count({
        vendorStoreId: storeId,
        trackInventory: true,
        quantity: { lte: 5, gt: 0 }
      }),
      this.count({
        vendorStoreId: storeId,
        trackInventory: true,
        quantity: 0
      }),
      this.model.aggregate({
        where: { vendorStoreId: storeId },
        _sum: { price: true }
      })
    ])

    return {
      totalProducts,
      activeProducts,
      draftProducts,
      lowStockCount: lowStockProducts,
      outOfStockCount: outOfStockProducts,
      totalValue: productValues._sum.price || 0
    }
  }

  /**
   * Search products across all stores (for admin)
   */
  async searchAllProducts(
    search: string,
    pagination: PaginationParams,
    filters: ProductFilters = {}
  ): Promise<PaginationResult<ProductWithRelations>> {
    const where = this.buildProductFilterClause({ ...filters, search })

    return this.findMany(where, pagination, {
      include: {
        vendor_stores: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: { take: 1 },
        _count: {
          select: {
            orderItems: true,
            reviews: true
          }
        }
      }
    })
  }

  /**
   * Duplicate product
   */
  async duplicateProduct(
    productId: string,
    newName: string,
    newSlug: string
  ): Promise<Product> {
    return this.transaction(async (tx) => {
      // Get original product with relations
      const original = await tx.product.findUnique({
        where: { id: productId },
        include: {
          images: true,
          variants: true,
          variantCombinations: true
        }
      })

      if (!original) {
        throw new Error('Product not found')
      }

      // Create new product
      const newProduct = await tx.product.create({
        data: {
          vendorStoreId: original.vendorStoreId,
          name: newName,
          slug: newSlug,
          description: original.description,
          category: original.category,
          subcategory: original.subcategory,
          price: original.price,
          compareAtPrice: original.compareAtPrice,
          trackInventory: original.trackInventory,
          quantity: 0, // Start with 0 inventory
          status: ProductStatus.DRAFT, // Start as draft
          hasVariants: original.hasVariants,
          variantType: original.variantType,
          useMultiVariants: original.useMultiVariants,
          variantTypes: original.variantTypes,
          weight: original.weight,
          dimensions: original.dimensions
        }
      })

      // Duplicate images
      if (original.images?.length > 0) {
        await tx.productImage.createMany({
          data: original.images.map(img => ({
            productId: newProduct.id,
            url: img.url,
            thumbnail: img.thumbnail,
            medium: img.medium,
            large: img.large,
            altText: img.altText,
            sortOrder: img.sortOrder
          }))
        })
      }

      // Duplicate variants
      if (original.variants?.length > 0) {
        await tx.productVariant.createMany({
          data: original.variants.map(variant => ({
            productId: newProduct.id,
            name: variant.name,
            value: variant.value,
            sku: variant.sku ? `${variant.sku}-copy` : null,
            price: variant.price,
            quantity: 0, // Start with 0 inventory
            isActive: variant.isActive
          }))
        })
      }

      // Duplicate variant combinations
      if (original.variantCombinations?.length > 0) {
        await tx.productVariantCombination.createMany({
          data: original.variantCombinations.map(combo => ({
            productId: newProduct.id,
            combinationKey: combo.combinationKey,
            optionValues: combo.optionValues,
            sku: combo.sku ? `${combo.sku}-copy` : null,
            price: combo.price,
            compareAtPrice: combo.compareAtPrice,
            quantity: 0, // Start with 0 inventory
            available: combo.available,
            sortOrder: combo.sortOrder,
            imageUrl: combo.imageUrl
          }))
        })
      }

      return newProduct
    })
  }

  /**
   * Build filter clause for products
   */
  private buildProductFilterClause(filters: ProductFilters): any {
    const where: any = {}

    if (filters.storeId) {
      where.vendorStoreId = filters.storeId
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.hasVariants !== undefined) {
      where.hasVariants = filters.hasVariants
    }

    if (filters.lowStock) {
      where.trackInventory = true
      where.quantity = { lte: 5, gte: 0 }
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.price = {}
      if (filters.priceMin !== undefined) {
        where.price.gte = filters.priceMin
      }
      if (filters.priceMax !== undefined) {
        where.price.lte = filters.priceMax
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    return where
  }
}