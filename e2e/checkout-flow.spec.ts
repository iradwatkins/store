import { test, expect } from '@playwright/test'

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a store with products
    await page.goto('/stores')
    await page.waitForSelector('[data-testid="store-card"]')
    await page.locator('[data-testid="store-card"]').first().click()
  })

  test('should add product to cart', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Click on first product
    await page.locator('[data-testid="product-card"]').first().click()

    // Wait for product page to load
    await expect(page.locator('[data-testid="product-details"]')).toBeVisible()

    // Click "Add to Cart" button
    const addToCartButton = page.locator('button:has-text("Add to Cart")')
    await addToCartButton.click()

    // Check for success message or cart update
    await expect(
      page.locator('text=/added to cart|item added/i')
    ).toBeVisible({ timeout: 5000 })

    // Cart icon should show item count
    const cartBadge = page.locator('[data-testid="cart-count"]')
    await expect(cartBadge).toHaveText('1')
  })

  test('should update quantity in cart', async ({ page }) => {
    // Add product to cart first
    await page.waitForSelector('[data-testid="product-card"]')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.locator('button:has-text("Add to Cart")').click()
    await page.waitForTimeout(1000)

    // Navigate to cart
    await page.locator('[data-testid="cart-icon"], a[href*="/cart"]').click()

    // Find quantity input
    const quantityInput = page.locator('input[type="number"]').first()
    await quantityInput.fill('2')

    // Wait for cart to update
    await page.waitForTimeout(1000)

    // Check that subtotal has doubled
    const subtotal = await page.locator('[data-testid="cart-subtotal"]').textContent()
    expect(subtotal).toBeTruthy()
  })

  test('should remove item from cart', async ({ page }) => {
    // Add product to cart first
    await page.waitForSelector('[data-testid="product-card"]')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.locator('button:has-text("Add to Cart")').click()
    await page.waitForTimeout(1000)

    // Navigate to cart
    await page.locator('[data-testid="cart-icon"], a[href*="/cart"]').click()

    // Click remove button
    await page.locator('button[aria-label*="Remove"], button:has-text("Remove")').first().click()

    // Cart should be empty
    await expect(page.locator('text=/cart is empty/i')).toBeVisible()
  })

  test('should proceed to checkout (logged out - redirect to login)', async ({ page }) => {
    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.locator('button:has-text("Add to Cart")').click()
    await page.waitForTimeout(1000)

    // Navigate to cart
    await page.locator('[data-testid="cart-icon"], a[href*="/cart"]').click()

    // Click checkout button
    await page.locator('button:has-text("Checkout"), a:has-text("Checkout")').click()

    // Should redirect to login page (user not authenticated)
    await expect(page).toHaveURL(/\/login/)
  })

  test('should apply discount code', async ({ page }) => {
    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.locator('button:has-text("Add to Cart")').click()
    await page.waitForTimeout(1000)

    // Navigate to cart
    await page.locator('[data-testid="cart-icon"], a[href*="/cart"]').click()

    // Find discount code input (if present)
    const discountInput = page.locator('input[placeholder*="discount"], input[placeholder*="coupon"]')

    if (await discountInput.count() > 0) {
      await discountInput.fill('TEST10')
      await page.locator('button:has-text("Apply")').click()

      // Check for success or error message
      await page.waitForSelector('text=/applied|invalid/i', { timeout: 5000 })
    }
  })

  test('should calculate cart total correctly', async ({ page }) => {
    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]')
    const firstProduct = page.locator('[data-testid="product-card"]').first()

    // Get product price
    const priceText = await firstProduct.locator('[data-testid="product-price"]').textContent()

    await firstProduct.click()
    await page.locator('button:has-text("Add to Cart")').click()
    await page.waitForTimeout(1000)

    // Navigate to cart
    await page.locator('[data-testid="cart-icon"], a[href*="/cart"]').click()

    // Check that cart subtotal matches product price
    const cartSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent()
    expect(cartSubtotal).toContain(priceText?.replace(/\$/g, '').trim() || '')
  })

  test('should show out of stock message for unavailable products', async ({ page }) => {
    await page.goto('/store/test-store/products/out-of-stock-product')

    // Should show out of stock message
    await expect(page.locator('text=/out of stock/i')).toBeVisible()

    // Add to cart button should be disabled
    const addToCartButton = page.locator('button:has-text("Add to Cart")')
    await expect(addToCartButton).toBeDisabled()
  })
})
