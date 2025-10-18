/**
 * Base Repository Pattern
 * 
 * Provides standardized data access patterns
 * Eliminates duplicate database query patterns across the application
 */

import prisma from '@/lib/db'
import { PaginationParams, PaginationResult, FilterParams } from '@/lib/domain/types'
import { logger } from '@/lib/logger'

export interface WhereClause {
  [key: string]: any
}

export interface OrderByClause {
  [key: string]: 'asc' | 'desc'
}

export interface FindOptions {
  include?: any
  select?: any
  orderBy?: OrderByClause | OrderByClause[]
  take?: number
  skip?: number
}

export abstract class BaseRepository<T = any> {
  protected abstract model: any
  protected abstract entityName: string

  /**
   * Find entity by ID
   */
  async findById(
    id: string, 
    options: Omit<FindOptions, 'take' | 'skip'> = {}
  ): Promise<T | null> {
    try {
      const result = await this.model.findUnique({
        where: { id },
        ...options
      })
      
      if (result) {
        logger.debug(`${this.entityName} found`, { id })
      }
      
      return result
    } catch (error) {
      logger.error(`Error finding ${this.entityName} by ID`, { id, error })
      throw error
    }
  }

  /**
   * Find first entity matching criteria
   */
  async findFirst(
    where: WhereClause,
    options: Omit<FindOptions, 'take' | 'skip'> = {}
  ): Promise<T | null> {
    try {
      const result = await this.model.findFirst({
        where,
        ...options
      })
      
      logger.debug(`${this.entityName} findFirst`, { where, found: !!result })
      return result
    } catch (error) {
      logger.error(`Error finding first ${this.entityName}`, { where, error })
      throw error
    }
  }

  /**
   * Find many entities with pagination
   */
  async findMany(
    where: WhereClause = {},
    pagination: PaginationParams,
    options: Omit<FindOptions, 'take' | 'skip'> = {}
  ): Promise<PaginationResult<T>> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
      const skip = (page - 1) * limit

      const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          ...options
        }),
        this.model.count({ where })
      ])

      const result: PaginationResult<T> = {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }

      logger.debug(`${this.entityName} findMany`, { 
        where, 
        pagination: result.pagination 
      })

      return result
    } catch (error) {
      logger.error(`Error finding many ${this.entityName}`, { where, pagination, error })
      throw error
    }
  }

  /**
   * Find all entities matching criteria
   */
  async findAll(
    where: WhereClause = {},
    options: FindOptions = {}
  ): Promise<T[]> {
    try {
      const result = await this.model.findMany({
        where,
        ...options
      })

      logger.debug(`${this.entityName} findAll`, { where, count: result.length })
      return result
    } catch (error) {
      logger.error(`Error finding all ${this.entityName}`, { where, error })
      throw error
    }
  }

  /**
   * Create new entity
   */
  async create(data: any, options: { include?: any; select?: any } = {}): Promise<T> {
    try {
      const result = await this.model.create({
        data,
        ...options
      })

      logger.info(`${this.entityName} created`, { id: result.id })
      return result
    } catch (error) {
      logger.error(`Error creating ${this.entityName}`, { data, error })
      throw error
    }
  }

  /**
   * Create many entities
   */
  async createMany(data: any[], options: { skipDuplicates?: boolean } = {}): Promise<{ count: number }> {
    try {
      const result = await this.model.createMany({
        data,
        ...options
      })

      logger.info(`${this.entityName} bulk created`, { count: result.count })
      return result
    } catch (error) {
      logger.error(`Error bulk creating ${this.entityName}`, { count: data.length, error })
      throw error
    }
  }

  /**
   * Update entity by ID
   */
  async update(
    id: string,
    data: any,
    options: { include?: any; select?: any } = {}
  ): Promise<T> {
    try {
      const result = await this.model.update({
        where: { id },
        data,
        ...options
      })

      logger.info(`${this.entityName} updated`, { id })
      return result
    } catch (error) {
      logger.error(`Error updating ${this.entityName}`, { id, data, error })
      throw error
    }
  }

  /**
   * Update many entities
   */
  async updateMany(
    where: WhereClause,
    data: any
  ): Promise<{ count: number }> {
    try {
      const result = await this.model.updateMany({
        where,
        data
      })

      logger.info(`${this.entityName} bulk updated`, { where, count: result.count })
      return result
    } catch (error) {
      logger.error(`Error bulk updating ${this.entityName}`, { where, data, error })
      throw error
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<T> {
    try {
      const result = await this.model.delete({
        where: { id }
      })

      logger.info(`${this.entityName} deleted`, { id })
      return result
    } catch (error) {
      logger.error(`Error deleting ${this.entityName}`, { id, error })
      throw error
    }
  }

  /**
   * Delete many entities
   */
  async deleteMany(where: WhereClause): Promise<{ count: number }> {
    try {
      const result = await this.model.deleteMany({
        where
      })

      logger.info(`${this.entityName} bulk deleted`, { where, count: result.count })
      return result
    } catch (error) {
      logger.error(`Error bulk deleting ${this.entityName}`, { where, error })
      throw error
    }
  }

  /**
   * Soft delete entity (if entity supports it)
   */
  async softDelete(id: string): Promise<T> {
    try {
      const result = await this.model.update({
        where: { id },
        data: { deletedAt: new Date() }
      })

      logger.info(`${this.entityName} soft deleted`, { id })
      return result
    } catch (error) {
      logger.error(`Error soft deleting ${this.entityName}`, { id, error })
      throw error
    }
  }

  /**
   * Count entities matching criteria
   */
  async count(where: WhereClause = {}): Promise<number> {
    try {
      const result = await this.model.count({ where })
      
      logger.debug(`${this.entityName} count`, { where, count: result })
      return result
    } catch (error) {
      logger.error(`Error counting ${this.entityName}`, { where, error })
      throw error
    }
  }

  /**
   * Check if entity exists
   */
  async exists(where: WhereClause): Promise<boolean> {
    try {
      const result = await this.model.findFirst({
        where,
        select: { id: true }
      })

      const exists = !!result
      logger.debug(`${this.entityName} exists check`, { where, exists })
      return exists
    } catch (error) {
      logger.error(`Error checking ${this.entityName} existence`, { where, error })
      throw error
    }
  }

  /**
   * Execute transaction
   */
  async transaction<R>(
    operations: (prisma: typeof prisma) => Promise<R>
  ): Promise<R> {
    try {
      const result = await prisma.$transaction(operations)
      logger.info(`${this.entityName} transaction completed`)
      return result
    } catch (error) {
      logger.error(`${this.entityName} transaction failed`, { error })
      throw error
    }
  }

  /**
   * Build search where clause for text fields
   */
  protected buildSearchClause(
    search: string,
    fields: string[]
  ): WhereClause {
    if (!search || fields.length === 0) {
      return {}
    }

    return {
      OR: fields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive'
        }
      }))
    }
  }

  /**
   * Build filter clause for common filters
   */
  protected buildFilterClause(filters: FilterParams): WhereClause {
    const where: WhereClause = {}

    if (filters.search) {
      // Override this in specific repositories to define searchable fields
      Object.assign(where, this.buildSearchClause(filters.search, ['name']))
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.category) {
      where.category = filters.category
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

  /**
   * Get entity metrics
   */
  async getMetrics(): Promise<{
    total: number
    recentlyCreated: number
    recentlyUpdated: number
  }> {
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [total, recentlyCreated, recentlyUpdated] = await Promise.all([
        this.count(),
        this.count({ createdAt: { gte: oneDayAgo } }),
        this.count({ updatedAt: { gte: oneDayAgo } })
      ])

      return {
        total,
        recentlyCreated,
        recentlyUpdated
      }
    } catch (error) {
      logger.error(`Error getting ${this.entityName} metrics`, { error })
      throw error
    }
  }
}