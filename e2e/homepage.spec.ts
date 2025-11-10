import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible()

    // Check for hero section or main content
    await expect(page.locator('main')).toBeVisible()
  })

  test('should display store listings', async ({ page }) => {
    await page.goto('/stores')

    // Wait for stores to load
    await page.waitForSelector('[data-testid="store-card"]', { timeout: 10000 })

    // Check that at least one store is displayed
    const stores = await page.locator('[data-testid="store-card"]').count()
    expect(stores).toBeGreaterThan(0)
  })

  test('should navigate to store page when clicking store card', async ({ page }) => {
    await page.goto('/stores')

    // Wait for stores to load
    await page.waitForSelector('[data-testid="store-card"]')

    // Click first store card
    await page.locator('[data-testid="store-card"]').first().click()

    // Check URL changed to store page
    await expect(page).toHaveURL(/\/store\/[a-z0-9-]+/)

    // Check store page loaded
    await expect(page.locator('[data-testid="store-header"]')).toBeVisible()
  })

  test('should search for stores', async ({ page }) => {
    await page.goto('/stores')

    // Find and fill search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first()
    await searchInput.fill('test')

    // Wait for search results
    await page.waitForTimeout(1000) // Debounce delay

    // Results should be filtered
    await expect(page.locator('[data-testid="store-card"]')).toBeVisible()
  })

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Mobile menu button should be visible
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
    await expect(menuButton).toBeVisible()

    // Click menu button
    await menuButton.click()

    // Navigation menu should appear
    await expect(page.locator('nav')).toBeVisible()
  })
})
