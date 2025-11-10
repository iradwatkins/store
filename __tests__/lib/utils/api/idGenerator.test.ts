/**
 * Unit Tests: ID Generator Utilities
 *
 * Tests for ID generation helper functions
 */

import {
  generateId,
  idGenerators,
  parseId,
} from '@/lib/utils/api/idGenerator'

describe('generateId', () => {
  it('should generate ID with correct prefix', () => {
    const id = generateId('test')
    expect(id).toMatch(/^test_\d+_[a-z0-9]{9}$/)
  })

  it('should generate unique IDs', () => {
    const id1 = generateId('product')
    const id2 = generateId('product')

    expect(id1).not.toBe(id2)
  })

  it('should include timestamp in ID', () => {
    const beforeTimestamp = Date.now()
    const id = generateId('order')
    const afterTimestamp = Date.now()

    const parts = id.split('_')
    const timestamp = parseInt(parts[1], 10)

    expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
    expect(timestamp).toBeLessThanOrEqual(afterTimestamp)
  })

  it('should generate IDs with different prefixes', () => {
    const productId = generateId('product')
    const orderId = generateId('order')
    const addonId = generateId('addon')

    expect(productId).toMatch(/^product_/)
    expect(orderId).toMatch(/^order_/)
    expect(addonId).toMatch(/^addon_/)
  })

  it('should generate random component with correct length', () => {
    const id = generateId('test')
    const parts = id.split('_')
    const randomPart = parts[2]

    expect(randomPart).toHaveLength(9)
    expect(randomPart).toMatch(/^[a-z0-9]+$/)
  })

  it('should handle empty prefix', () => {
    const id = generateId('')
    expect(id).toMatch(/^_\d+_[a-z0-9]{9}$/)
  })

  it('should handle special characters in prefix', () => {
    const id = generateId('my-custom_prefix')
    expect(id).toMatch(/^my-custom_prefix_\d+_[a-z0-9]{9}$/)
  })
})

describe('idGenerators', () => {
  it('should have all expected generator functions', () => {
    expect(typeof idGenerators.product).toBe('function')
    expect(typeof idGenerators.order).toBe('function')
    expect(typeof idGenerators.addon).toBe('function')
    expect(typeof idGenerators.variant).toBe('function')
    expect(typeof idGenerators.image).toBe('function')
    expect(typeof idGenerators.coupon).toBe('function')
    expect(typeof idGenerators.review).toBe('function')
    expect(typeof idGenerators.store).toBe('function')
    expect(typeof idGenerators.zone).toBe('function')
    expect(typeof idGenerators.rate).toBe('function')
    expect(typeof idGenerators.vacation).toBe('function')
    expect(typeof idGenerators.withdraw).toBe('function')
    expect(typeof idGenerators.announcement).toBe('function')
  })

  it('should generate product ID with correct prefix', () => {
    const id = idGenerators.product()
    expect(id).toMatch(/^product_/)
  })

  it('should generate order ID with correct prefix', () => {
    const id = idGenerators.order()
    expect(id).toMatch(/^order_/)
  })

  it('should generate addon ID with correct prefix', () => {
    const id = idGenerators.addon()
    expect(id).toMatch(/^addon_/)
  })

  it('should generate variant ID with correct prefix', () => {
    const id = idGenerators.variant()
    expect(id).toMatch(/^variant_/)
  })

  it('should generate image ID with correct prefix', () => {
    const id = idGenerators.image()
    expect(id).toMatch(/^image_/)
  })

  it('should generate coupon ID with correct prefix', () => {
    const id = idGenerators.coupon()
    expect(id).toMatch(/^coupon_/)
  })

  it('should generate review ID with correct prefix', () => {
    const id = idGenerators.review()
    expect(id).toMatch(/^review_/)
  })

  it('should generate store ID with correct prefix', () => {
    const id = idGenerators.store()
    expect(id).toMatch(/^store_/)
  })

  it('should generate zone ID with correct prefix', () => {
    const id = idGenerators.zone()
    expect(id).toMatch(/^zone_/)
  })

  it('should generate rate ID with correct prefix', () => {
    const id = idGenerators.rate()
    expect(id).toMatch(/^rate_/)
  })

  it('should generate vacation ID with correct prefix', () => {
    const id = idGenerators.vacation()
    expect(id).toMatch(/^vac_/)
  })

  it('should generate withdraw ID with correct prefix', () => {
    const id = idGenerators.withdraw()
    expect(id).toMatch(/^wdr_/)
  })

  it('should generate announcement ID with correct prefix', () => {
    const id = idGenerators.announcement()
    expect(id).toMatch(/^ann_/)
  })

  it('should generate unique IDs for same generator', () => {
    const id1 = idGenerators.product()
    const id2 = idGenerators.product()
    const id3 = idGenerators.product()

    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id1).not.toBe(id3)
  })
})

describe('parseId', () => {
  it('should parse valid ID correctly', () => {
    const timestamp = Date.now()
    const id = `product_${timestamp}_abc123xyz`

    const result = parseId(id)

    expect(result).not.toBeNull()
    expect(result?.prefix).toBe('product')
    expect(result?.timestamp).toBe(timestamp)
    expect(result?.random).toBe('abc123xyz')
    expect(result?.createdAt).toEqual(new Date(timestamp))
  })

  it('should parse generated ID correctly', () => {
    const id = generateId('order')
    const result = parseId(id)

    expect(result).not.toBeNull()
    expect(result?.prefix).toBe('order')
    expect(typeof result?.timestamp).toBe('number')
    expect(typeof result?.random).toBe('string')
    expect(result?.createdAt).toBeInstanceOf(Date)
  })

  it('should return null for invalid ID format', () => {
    const invalidIds = [
      'invalid',
      'product_timestamp',
      'too_many_parts_here_invalid',
      '',
      'product_',
    ]

    invalidIds.forEach(id => {
      const result = parseId(id)
      expect(result).toBeNull()
    })
  })

  it('should return null for ID with non-numeric timestamp', () => {
    const id = 'product_notanumber_abc123'
    const result = parseId(id)

    expect(result).toBeNull()
  })

  it('should handle ID with empty prefix', () => {
    const timestamp = Date.now()
    const id = `_${timestamp}_random123`

    const result = parseId(id)

    expect(result).not.toBeNull()
    expect(result?.prefix).toBe('')
    expect(result?.timestamp).toBe(timestamp)
  })

  it('should parse createdAt date correctly', () => {
    const specificTime = new Date('2025-01-15T12:00:00.000Z').getTime()
    const id = `test_${specificTime}_xyz789`

    const result = parseId(id)

    expect(result).not.toBeNull()
    expect(result?.createdAt.toISOString()).toBe('2025-01-15T12:00:00.000Z')
  })

  it('should handle all generated ID types', () => {
    const generators = [
      idGenerators.product,
      idGenerators.order,
      idGenerators.addon,
      idGenerators.variant,
      idGenerators.coupon,
    ]

    generators.forEach(generator => {
      const id = generator()
      const result = parseId(id)

      expect(result).not.toBeNull()
      expect(typeof result?.prefix).toBe('string')
      expect(typeof result?.timestamp).toBe('number')
      expect(typeof result?.random).toBe('string')
      expect(result?.createdAt).toBeInstanceOf(Date)
    })
  })

  it('should maintain timestamp accuracy', () => {
    const beforeTime = Date.now()
    const id = generateId('accuracytest')
    const afterTime = Date.now()

    const result = parseId(id)

    expect(result).not.toBeNull()
    expect(result!.timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(result!.timestamp).toBeLessThanOrEqual(afterTime)
    expect(result!.createdAt.getTime()).toBe(result!.timestamp)
  })
})
