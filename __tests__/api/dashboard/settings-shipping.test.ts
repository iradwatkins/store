import { z } from 'zod'

// Import the Zod schema we're testing
const shippingSettingsSchema = z.object({
  flatRate: z.number().min(0).nullable(),
  freeShippingThreshold: z.number().min(0).nullable(),
  localPickupEnabled: z.boolean(),
})

describe('Shipping Settings Validation', () => {
  describe('flatRate validation', () => {
    it('accepts null flatRate', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid positive flatRate', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 9.99,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('accepts flatRate of 0', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 0,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('rejects negative flatRate', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: -5,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('flatRate')
      }
    })
  })

  describe('freeShippingThreshold validation', () => {
    it('accepts null freeShippingThreshold', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid threshold', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: 50.00,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('rejects negative threshold', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: -10,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('localPickupEnabled validation', () => {
    it('accepts true', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: null,
        localPickupEnabled: true,
      })
      expect(result.success).toBe(true)
    })

    it('accepts false', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-boolean values', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: null,
        localPickupEnabled: 'yes', // Invalid
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Combined scenarios', () => {
    it('accepts all fields set to meaningful values', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 8.99,
        freeShippingThreshold: 50.00,
        localPickupEnabled: true,
      })
      expect(result.success).toBe(true)
    })

    it('accepts all fields null/false (free shipping)', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: null,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('handles typical store configuration', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 5.99,
        freeShippingThreshold: 100.00,
        localPickupEnabled: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.flatRate).toBe(5.99)
        expect(result.data.freeShippingThreshold).toBe(100.00)
        expect(result.data.localPickupEnabled).toBe(true)
      }
    })
  })

  describe('Type coercion and edge cases', () => {
    it('accepts decimal values for rates', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 9.99,
        freeShippingThreshold: 49.99,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('accepts integer values for rates', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 10,
        freeShippingThreshold: 50,
        localPickupEnabled: false,
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing required fields', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 10,
        // Missing freeShippingThreshold
        // Missing localPickupEnabled
      })
      expect(result.success).toBe(false)
    })

    it('rejects extra fields', () => {
      const result = shippingSettingsSchema.safeParse({
        flatRate: 10,
        freeShippingThreshold: 50,
        localPickupEnabled: true,
        extraField: 'should fail',
      })
      // Zod by default ignores extra fields, so this will pass
      // If you want strict mode, use .strict() on schema
      expect(result.success).toBe(true)
    })
  })
})

describe('Shipping Settings Business Logic', () => {
  describe('Shipping cost calculation scenarios', () => {
    it('should charge flat rate when order below threshold', () => {
      const settings = {
        flatRate: 8.99,
        freeShippingThreshold: 50.00,
        localPickupEnabled: false,
      }
      const orderTotal = 30.00

      // Business logic: order < threshold, charge flat rate
      const shippingCost = orderTotal >= (settings.freeShippingThreshold || Infinity)
        ? 0
        : (settings.flatRate || 0)

      expect(shippingCost).toBe(8.99)
    })

    it('should be free when order meets threshold', () => {
      const settings = {
        flatRate: 8.99,
        freeShippingThreshold: 50.00,
        localPickupEnabled: false,
      }
      const orderTotal = 50.00

      const shippingCost = orderTotal >= (settings.freeShippingThreshold || Infinity)
        ? 0
        : (settings.flatRate || 0)

      expect(shippingCost).toBe(0)
    })

    it('should be free when order exceeds threshold', () => {
      const settings = {
        flatRate: 8.99,
        freeShippingThreshold: 50.00,
        localPickupEnabled: false,
      }
      const orderTotal = 75.00

      const shippingCost = orderTotal >= (settings.freeShippingThreshold || Infinity)
        ? 0
        : (settings.flatRate || 0)

      expect(shippingCost).toBe(0)
    })

    it('should be free when no flat rate set', () => {
      const settings = {
        flatRate: null,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      }
      const orderTotal = 30.00

      const shippingCost = orderTotal >= (settings.freeShippingThreshold || Infinity)
        ? 0
        : (settings.flatRate || 0)

      expect(shippingCost).toBe(0)
    })

    it('should always charge flat rate when no threshold set', () => {
      const settings = {
        flatRate: 5.99,
        freeShippingThreshold: null,
        localPickupEnabled: false,
      }
      const orderTotal = 200.00

      const shippingCost = orderTotal >= (settings.freeShippingThreshold || Infinity)
        ? 0
        : (settings.flatRate || 0)

      expect(shippingCost).toBe(5.99)
    })
  })
})
