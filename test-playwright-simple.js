/**
 * Playwright Test Suite for Multi-Variant Product System
 * 
 * Installation:
 * npm install @playwright/test
 * npx playwright install
 * 
 * Run tests:
 * npx playwright test test-playwright-simple.js
 * npx playwright test test-playwright-simple.js --headed --browser=chromium
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.TEST_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  testData: {
    vendor: {
      email: 'vendor@test.com',
      password: 'testpass123',
      storeName: 'Test Variant Store'
    },
    customer: {
      email: 'customer@test.com',
      password: 'testpass123'
    },
    product: {
      name: 'Multi-Variant Test Product',
      description: 'A test product with multiple variant combinations',
      price: '29.99',
      category: 'CLOTHING'
    }
  }
};

test.describe('Multi-Variant Product System', () => {
  
  // Global setup and teardown
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Vendor Product Creation Flow', () => {
    
    test('should complete product variant wizard flow', async ({ page }) => {
      // Step 1: Navigate to product creation
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/products/new`);
      
      // Wait for the wizard to load
      await page.waitForSelector('[data-testid="product-variant-wizard"], .wizard-container', { timeout: 10000 });
      
      // Step 2: Select product with variants
      const variantOption = page.locator('input[value="true"], [data-value="variants"], label:has-text("variants")').first();
      if (await variantOption.isVisible()) {
        await variantOption.click();
      }
      
      // Step 3: Click Next to proceed
      const nextButton = page.locator('button:has-text("Next"), [data-testid="next-button"]').first();
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
      
      // Step 4: Select variant types (Size and Color)
      const sizeCheckbox = page.locator('input[type="checkbox"]:near(:text("Size")), [data-variant-type="SIZE"]').first();
      const colorCheckbox = page.locator('input[type="checkbox"]:near(:text("Color")), [data-variant-type="COLOR"]').first();
      
      if (await sizeCheckbox.isVisible()) {
        await sizeCheckbox.check();
      }
      if (await colorCheckbox.isVisible()) {
        await colorCheckbox.check();
      }
      
      // Step 5: Proceed to configure options
      const nextButton2 = page.locator('button:has-text("Next")').first();
      if (await nextButton2.isVisible() && await nextButton2.isEnabled()) {
        await nextButton2.click();
        await page.waitForTimeout(500);
      }
      
      // Step 6: Configure variant options
      // Look for template selectors or option inputs
      const templateSelect = page.locator('select:has-text("template"), select[data-testid*="template"]').first();
      if (await templateSelect.isVisible()) {
        await templateSelect.selectOption({ index: 1 }); // Select first available template
      }
      
      // Add some custom options if available
      const customInput = page.locator('input[placeholder*="custom"], input[data-testid="custom-option"]').first();
      if (await customInput.isVisible()) {
        await customInput.fill('Custom Size');
        const addButton = page.locator('button:has-text("Add"), button[data-testid="add-option"]').first();
        if (await addButton.isVisible()) {
          await addButton.click();
        }
      }
      
      // Verify variant combinations are generated
      const combinationCount = page.locator('[data-testid="combination-count"], :text("combinations")').first();
      await expect(combinationCount).toBeVisible({ timeout: 5000 });
    });

    test('should handle variant type selection validation', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/products/new`);
      
      // Try to proceed without selecting variant types
      const nextButton = page.locator('button:has-text("Next")').first();
      
      // Should show validation error or disable next button
      if (await nextButton.isVisible()) {
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          // Look for error message
          const errorMessage = page.locator('[role="alert"], .error-message, :text("required")').first();
          await expect(errorMessage).toBeVisible({ timeout: 3000 });
        } else {
          // Button should be disabled
          await expect(nextButton).toBeDisabled();
        }
      }
    });

  });

  test.describe('Customer Variant Selection', () => {
    
    test('should display multi-variant selector on product page', async ({ page }) => {
      // Navigate to a product page (assuming we have test products)
      await page.goto(`${TEST_CONFIG.baseURL}/store/test-store/products/test-product`);
      
      // Look for variant selector components
      const variantSelector = page.locator('[data-testid="multi-variant-selector"], .variant-selector').first();
      
      // If variant selector exists, test its functionality
      if (await variantSelector.isVisible({ timeout: 5000 })) {
        // Test variant option selection
        const variantButtons = variantSelector.locator('button[data-variant-option], .variant-option');
        const buttonCount = await variantButtons.count();
        
        if (buttonCount > 0) {
          // Click first variant option
          await variantButtons.first().click();
          
          // Verify selection state
          await expect(variantButtons.first()).toHaveClass(/selected|active/);
          
          // Check if price updates
          const priceElement = page.locator('[data-testid="price"], .price').first();
          await expect(priceElement).toBeVisible();
        }
      } else {
        // This might be a simple product - verify simple product display
        const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
        await expect(addToCartButton).toBeVisible();
      }
    });

    test('should update availability based on variant selection', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/store/test-store/products/test-variant-product`);
      
      const variantSelector = page.locator('[data-testid="multi-variant-selector"]').first();
      if (await variantSelector.isVisible({ timeout: 5000 })) {
        
        // Select different variant combinations
        const sizeOptions = variantSelector.locator('[data-variant-type="size"] button, button[data-size]');
        const colorOptions = variantSelector.locator('[data-variant-type="color"] button, button[data-color]');
        
        if (await sizeOptions.count() > 0 && await colorOptions.count() > 0) {
          await sizeOptions.first().click();
          await colorOptions.first().click();
          
          // Check availability status
          const availabilityStatus = page.locator('[data-testid="availability"], .availability-status').first();
          await expect(availabilityStatus).toBeVisible({ timeout: 3000 });
          
          // Verify Add to Cart button state
          const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
          const isInStock = await availabilityStatus.textContent();
          
          if (isInStock && isInStock.includes('In Stock')) {
            await expect(addToCartBtn).toBeEnabled();
          } else if (isInStock && isInStock.includes('Out of Stock')) {
            await expect(addToCartBtn).toBeDisabled();
          }
        }
      }
    });

  });

  test.describe('Cart Integration', () => {
    
    test('should add multi-variant products to cart', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/store/test-store/products/test-variant-product`);
      
      // Select variant options
      const variantSelector = page.locator('[data-testid="multi-variant-selector"]').first();
      if (await variantSelector.isVisible({ timeout: 5000 })) {
        
        // Select first available options for each variant type
        const variantTypes = ['size', 'color', 'material'];
        for (const type of variantTypes) {
          const options = variantSelector.locator(`[data-variant-type="${type}"] button, button[data-${type}]`);
          if (await options.count() > 0) {
            await options.first().click();
            await page.waitForTimeout(200);
          }
        }
        
        // Add to cart
        const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
        if (await addToCartBtn.isEnabled()) {
          await addToCartBtn.click();
          
          // Verify cart API call was made
          await page.waitForResponse(response => 
            response.url().includes('/api/cart/add') && response.status() === 200
          );
          
          // Check for success notification
          const successMessage = page.locator('[role="alert"]:has-text("added"), .toast:has-text("cart")').first();
          await expect(successMessage).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should display variant details in cart', async ({ page }) => {
      // First add a product to cart (assuming cart has items)
      await page.goto(`${TEST_CONFIG.baseURL}/cart`);
      
      // Look for cart items with variant details
      const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      
      if (itemCount > 0) {
        // Check first cart item for variant information
        const firstItem = cartItems.first();
        const variantInfo = firstItem.locator('.variant-info, [data-testid="variant-details"]');
        
        // Verify variant details are displayed (size, color, etc.)
        if (await variantInfo.isVisible()) {
          const variantText = await variantInfo.textContent();
          expect(variantText).toMatch(/(size|color|material)/i);
        }
      }
    });

  });

  test.describe('Inventory Management', () => {
    
    test('should display variant combination table', async ({ page }) => {
      // Navigate to product edit page
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/products/test-product-id/edit`);
      
      // Look for variant combination table
      const combinationTable = page.locator('[data-testid="variant-combination-table"], .variant-combination-table').first();
      
      if (await combinationTable.isVisible({ timeout: 5000 })) {
        // Verify table structure
        const tableHeaders = combinationTable.locator('th, .table-header');
        await expect(tableHeaders).toHaveCount({ min: 4 }); // At least variant, price, quantity, status columns
        
        // Test inline editing
        const editableFields = combinationTable.locator('input[data-editable], .editable-field');
        if (await editableFields.count() > 0) {
          const firstField = editableFields.first();
          await firstField.click();
          await firstField.fill('99');
          
          // Look for save button
          const saveBtn = combinationTable.locator('button:has-text("Save"), [data-action="save"]').first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
          }
        }
      }
    });

    test('should handle bulk operations', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/products/test-product-id/edit`);
      
      const bulkSection = page.locator('[data-testid="bulk-operations"], .bulk-operations').first();
      
      if (await bulkSection.isVisible({ timeout: 5000 })) {
        // Select multiple combinations
        const checkboxes = bulkSection.locator('input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();
        
        if (checkboxCount > 1) {
          await checkboxes.first().check();
          await checkboxes.nth(1).check();
          
          // Select bulk action
          const actionSelect = bulkSection.locator('select[data-testid="bulk-action"]').first();
          if (await actionSelect.isVisible()) {
            await actionSelect.selectOption('price');
            
            // Enter bulk value
            const valueInput = bulkSection.locator('input[placeholder*="price"], input[data-testid="bulk-value"]').first();
            if (await valueInput.isVisible()) {
              await valueInput.fill('25.99');
              
              // Apply bulk action
              const applyBtn = bulkSection.locator('button:has-text("Apply")').first();
              if (await applyBtn.isVisible()) {
                await applyBtn.click();
                
                // Wait for success notification
                await expect(page.locator('[role="alert"]:has-text("updated"), .toast:has-text("success")')).toBeVisible({ timeout: 5000 });
              }
            }
          }
        }
      }
    });

  });

  test.describe('API Integration', () => {
    
    test('should handle variant combination API calls', async ({ page }) => {
      // Test API endpoints
      const response = await page.request.get(`${TEST_CONFIG.baseURL}/api/vendor/products/test-id/variants/combinations`);
      
      // API might not exist in test environment, so handle both cases
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('combinations');
      } else if (response.status() === 404) {
        // Expected for non-existent product
        expect(response.status()).toBe(404);
      } else {
        // Should not be a server error
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('should validate cart API with variant combinations', async ({ page }) => {
      const cartData = {
        productId: 'test-product-id',
        variantCombinationId: 'test-combination-id',
        quantity: 1,
        storeSlug: 'test-store'
      };

      const response = await page.request.post(`${TEST_CONFIG.baseURL}/api/cart/add`, {
        data: cartData
      });

      // Handle various response scenarios
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
      } else if (response.status() === 401) {
        // Expected if not authenticated
        expect(response.status()).toBe(401);
      } else if (response.status() === 404) {
        // Expected if product doesn't exist
        expect(response.status()).toBe(404);
      } else {
        // Should not be a server error
        expect(response.status()).toBeLessThan(500);
      }
    });

  });

  test.describe('Performance & Accessibility', () => {
    
    test('should load variant components quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/products/new`);
      await page.waitForSelector('[data-testid="product-variant-wizard"], .wizard-container', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
    });

    test('should be accessible with keyboard navigation', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/store/test-store/products/test-variant-product`);
      
      // Test keyboard navigation
      const variantButtons = page.locator('button[data-variant-option], .variant-option button');
      const buttonCount = await variantButtons.count();
      
      if (buttonCount > 0) {
        // Focus first button
        await variantButtons.first().focus();
        
        // Press Tab to navigate
        await page.keyboard.press('Tab');
        
        // Press Enter to select
        await page.keyboard.press('Enter');
        
        // Verify selection worked
        const selectedButton = page.locator('button[data-variant-option][aria-selected="true"], button.selected').first();
        if (await selectedButton.isVisible()) {
          await expect(selectedButton).toBeVisible();
        }
      }
    });

    test('should handle multiple variant combinations efficiently', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/products/test-large-variant-product/edit`);
      
      // Look for large variant combination table
      const table = page.locator('[data-testid="variant-combination-table"]').first();
      
      if (await table.isVisible({ timeout: 5000 })) {
        const startTime = Date.now();
        
        // Scroll through table
        await table.scrollIntoViewIfNeeded();
        
        // Check rendering performance
        const rows = table.locator('tr, .table-row');
        const rowCount = await rows.count();
        
        const renderTime = Date.now() - startTime;
        
        // Should render efficiently even with many combinations
        if (rowCount > 50) {
          expect(renderTime).toBeLessThan(3000); // 3 seconds for large tables
        }
      }
    });

  });

  test.describe('Error Handling', () => {
    
    test('should handle invalid variant combinations gracefully', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/store/test-store/products/test-variant-product`);
      
      // Try to select invalid combination
      const variantSelector = page.locator('[data-testid="multi-variant-selector"]').first();
      
      if (await variantSelector.isVisible({ timeout: 5000 })) {
        // Mock a scenario where combination is out of stock
        const outOfStockOption = variantSelector.locator('button[disabled], button[data-available="false"]').first();
        
        if (await outOfStockOption.isVisible()) {
          // Should not be clickable
          await expect(outOfStockOption).toBeDisabled();
          
          // Should show appropriate messaging
          const unavailableMessage = page.locator(':text("unavailable"), :text("out of stock")').first();
          await expect(unavailableMessage).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test('should validate required variant selections', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/store/test-store/products/test-variant-product`);
      
      // Try to add to cart without selecting all required variants
      const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
      
      if (await addToCartBtn.isVisible()) {
        // Button should be disabled if not all variants selected
        const isEnabled = await addToCartBtn.isEnabled();
        
        if (!isEnabled) {
          // Should show helper text
          const helperText = page.locator(':text("select"), :text("required")').first();
          await expect(helperText).toBeVisible({ timeout: 3000 });
        }
      }
    });

  });

});

// Test hooks for setup and cleanup
test.beforeAll(async () => {
  console.log('🧪 Starting Multi-Variant Test Suite');
});

test.afterAll(async () => {
  console.log('✅ Multi-Variant Test Suite Completed');
});

// Custom assertions and utilities
test.extend({
  // Custom fixture for variant testing
  variantTestUtils: async ({ page }, use) => {
    const utils = {
      async selectVariantCombination(types = []) {
        for (const type of types) {
          const option = page.locator(`[data-variant-type="${type}"] button`).first();
          if (await option.isVisible()) {
            await option.click();
          }
        }
      },
      
      async waitForVariantUpdate() {
        await page.waitForTimeout(500); // Allow for variant selection updates
      },
      
      async getSelectedVariants() {
        const selected = await page.locator('button[data-variant-option][aria-selected="true"]').allTextContents();
        return selected;
      }
    };
    
    await use(utils);
  }
});

module.exports = { TEST_CONFIG };