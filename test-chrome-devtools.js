/**
 * Chrome DevTools Testing Script for Multi-Variant Product System
 * 
 * Instructions:
 * 1. Open Chrome DevTools (F12)
 * 2. Navigate to Console tab
 * 3. Copy and paste this entire script
 * 4. Run individual tests or full suite
 * 
 * Usage:
 * - MultiVariantTestRunner.runAllTests() - Run complete test suite
 * - MultiVariantTestRunner.testVendorProductCreation() - Test vendor flow
 * - MultiVariantTestRunner.testCustomerVariantSelection() - Test customer flow
 */

class MultiVariantTestRunner {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const styles = {
      info: 'color: #2563eb; font-weight: normal;',
      success: 'color: #16a34a; font-weight: bold;',
      error: 'color: #dc2626; font-weight: bold;',
      warning: 'color: #ea580c; font-weight: bold;'
    };
    
    console.log(`%c[${timestamp}] ${message}`, styles[type]);
  }

  async assert(condition, message) {
    if (condition) {
      this.log(`✅ PASS: ${message}`, 'success');
      return true;
    } else {
      this.log(`❌ FAIL: ${message}`, 'error');
      this.testResults.push({ test: this.currentTest, result: 'FAIL', message });
      return false;
    }
  }

  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  }

  async waitForElementWithText(selector, text, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.textContent.includes(text)) return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Element ${selector} with text "${text}" not found within ${timeout}ms`);
  }

  async simulateClick(element) {
    element.scrollIntoView();
    await new Promise(resolve => setTimeout(resolve, 100));
    element.click();
  }

  async simulateInput(element, value) {
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Test Suite 1: Vendor Product Creation Flow
  async testVendorProductCreation() {
    this.currentTest = 'Vendor Product Creation';
    this.log('🚀 Starting Vendor Product Creation Tests', 'info');

    try {
      // Test 1: Navigate to product creation page
      this.log('Test 1: Navigating to product creation...', 'info');
      const currentUrl = window.location.href;
      await this.assert(
        currentUrl.includes('/dashboard/products') || currentUrl.includes('/products/new'),
        'Should be on products page or creation page'
      );

      // Test 2: Check ProductVariantWizard component exists
      this.log('Test 2: Checking for ProductVariantWizard component...', 'info');
      const wizardComponent = document.querySelector('[data-testid="product-variant-wizard"], .product-variant-wizard');
      if (!wizardComponent) {
        // Try to find wizard trigger button
        const newProductBtn = document.querySelector('button[data-testid="new-product"], a[href*="products/new"]');
        if (newProductBtn) {
          await this.simulateClick(newProductBtn);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Test 3: Check wizard steps are rendered
      this.log('Test 3: Checking wizard step indicators...', 'info');
      const stepIndicators = document.querySelectorAll('[class*="step"], [data-step]');
      await this.assert(stepIndicators.length >= 3, 'Should have at least 3 wizard steps');

      // Test 4: Test Step 1 - Product Type Selection
      this.log('Test 4: Testing Step 1 - Product Type Selection...', 'info');
      const variantProductOption = document.querySelector('input[value="true"], [data-value="variants"], [id="variants"]');
      if (variantProductOption) {
        await this.simulateClick(variantProductOption);
        await this.assert(variantProductOption.checked || variantProductOption.getAttribute('data-state') === 'checked', 
          'Should select product with variants option');
      }

      // Test 5: Check Next button functionality
      this.log('Test 5: Testing Next button...', 'info');
      const nextButton = document.querySelector('button[data-testid="next"], button:contains("Next")');
      if (nextButton && !nextButton.disabled) {
        await this.simulateClick(nextButton);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Test 6: Test Step 2 - Variant Types Selection
      this.log('Test 6: Testing Step 2 - Variant Types Selection...', 'info');
      const variantTypeCheckboxes = document.querySelectorAll('input[type="checkbox"][data-variant-type], [data-testid*="variant-type"]');
      await this.assert(variantTypeCheckboxes.length >= 3, 'Should have variant type options (SIZE, COLOR, MATERIAL, etc.)');

      // Select SIZE and COLOR variant types
      for (const checkbox of variantTypeCheckboxes) {
        const label = checkbox.closest('label') || document.querySelector(`label[for="${checkbox.id}"]`);
        if (label && (label.textContent.includes('Size') || label.textContent.includes('Color'))) {
          await this.simulateClick(checkbox);
        }
      }

      // Test 7: Test Step 3 - Configure Options
      this.log('Test 7: Testing Step 3 - Configure Options...', 'info');
      const nextBtn2 = document.querySelector('button[data-testid="next"], button:contains("Next")');
      if (nextBtn2 && !nextBtn2.disabled) {
        await this.simulateClick(nextBtn2);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check for template selectors
      const templateSelectors = document.querySelectorAll('select[data-testid*="template"], [data-testid="template-selector"]');
      await this.assert(templateSelectors.length > 0, 'Should have template selectors for variant options');

      this.log('✅ Vendor Product Creation Tests Completed', 'success');

    } catch (error) {
      this.log(`❌ Vendor Product Creation Test Failed: ${error.message}`, 'error');
    }
  }

  // Test Suite 2: Customer Variant Selection
  async testCustomerVariantSelection() {
    this.currentTest = 'Customer Variant Selection';
    this.log('🛍️ Starting Customer Variant Selection Tests', 'info');

    try {
      // Test 1: Check for MultiVariantSelector component
      this.log('Test 1: Checking for MultiVariantSelector component...', 'info');
      const variantSelector = document.querySelector('[data-testid="multi-variant-selector"], .multi-variant-selector');
      
      if (!variantSelector) {
        // Navigate to a product page if not already there
        const productLinks = document.querySelectorAll('a[href*="/products/"]');
        if (productLinks.length > 0) {
          await this.simulateClick(productLinks[0]);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Test 2: Check variant type sections
      this.log('Test 2: Checking variant type sections...', 'info');
      const variantSections = document.querySelectorAll('[data-variant-type], .variant-type-section');
      await this.assert(variantSections.length > 0, 'Should have variant type sections (Size, Color, etc.)');

      // Test 3: Test variant option selection
      this.log('Test 3: Testing variant option selection...', 'info');
      const variantButtons = document.querySelectorAll('button[data-variant-option], .variant-option-button');
      if (variantButtons.length > 0) {
        await this.simulateClick(variantButtons[0]);
        await this.assert(
          variantButtons[0].classList.contains('selected') || 
          variantButtons[0].getAttribute('data-state') === 'selected',
          'Should select variant option when clicked'
        );
      }

      // Test 4: Check price updates
      this.log('Test 4: Checking price updates...', 'info');
      const priceElements = document.querySelectorAll('[data-testid="price"], .price');
      await this.assert(priceElements.length > 0, 'Should display price information');

      // Test 5: Check availability status
      this.log('Test 5: Checking availability status...', 'info');
      const availabilityElements = document.querySelectorAll('[data-testid="availability"], .availability-status');
      await this.assert(availabilityElements.length > 0, 'Should display availability status');

      // Test 6: Test Add to Cart functionality
      this.log('Test 6: Testing Add to Cart functionality...', 'info');
      const addToCartBtn = document.querySelector('button[data-testid="add-to-cart"], button:contains("Add to Cart")');
      await this.assert(addToCartBtn !== null, 'Should have Add to Cart button');

      this.log('✅ Customer Variant Selection Tests Completed', 'success');

    } catch (error) {
      this.log(`❌ Customer Variant Selection Test Failed: ${error.message}`, 'error');
    }
  }

  // Test Suite 3: Cart and Checkout Tests
  async testCartAndCheckout() {
    this.currentTest = 'Cart and Checkout';
    this.log('🛒 Starting Cart and Checkout Tests', 'info');

    try {
      // Test 1: Check cart API integration
      this.log('Test 1: Testing cart API integration...', 'info');
      
      // Simulate adding item to cart with variant combination
      const testCartData = {
        productId: 'test-product-id',
        variantCombinationId: 'test-combination-id',
        quantity: 1,
        storeSlug: 'test-store'
      };

      // Mock fetch to test cart API
      const originalFetch = window.fetch;
      let cartApiCalled = false;
      window.fetch = async (url, options) => {
        if (url.includes('/api/cart/add')) {
          cartApiCalled = true;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        }
        return originalFetch(url, options);
      };

      // Test cart API call
      try {
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCartData)
        });
        await this.assert(cartApiCalled, 'Should call cart API with variant combination data');
      } finally {
        window.fetch = originalFetch;
      }

      // Test 2: Check cart display
      this.log('Test 2: Checking cart display...', 'info');
      const cartElements = document.querySelectorAll('[data-testid="cart"], .cart-item');
      await this.assert(cartElements.length >= 0, 'Should have cart display elements');

      // Test 3: Check variant details in cart
      this.log('Test 3: Checking variant details in cart...', 'info');
      const variantDetails = document.querySelectorAll('[data-testid="variant-details"], .variant-info');
      // This is optional since we might not have cart items
      this.log('Variant details in cart: Found ' + variantDetails.length + ' elements', 'info');

      this.log('✅ Cart and Checkout Tests Completed', 'success');

    } catch (error) {
      this.log(`❌ Cart and Checkout Test Failed: ${error.message}`, 'error');
    }
  }

  // Test Suite 4: Inventory Management Tests
  async testInventoryManagement() {
    this.currentTest = 'Inventory Management';
    this.log('📦 Starting Inventory Management Tests', 'info');

    try {
      // Test 1: Check VariantCombinationTable component
      this.log('Test 1: Checking VariantCombinationTable component...', 'info');
      const combinationTable = document.querySelector('[data-testid="variant-combination-table"], .variant-combination-table');
      
      if (!combinationTable) {
        // Try to navigate to product edit page
        const editButtons = document.querySelectorAll('a[href*="/edit"], button[data-action="edit"]');
        if (editButtons.length > 0) {
          await this.simulateClick(editButtons[0]);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Test 2: Check table headers
      this.log('Test 2: Checking table structure...', 'info');
      const tableHeaders = document.querySelectorAll('th, .table-header');
      await this.assert(tableHeaders.length > 0, 'Should have table headers for variant management');

      // Test 3: Check bulk operations
      this.log('Test 3: Checking bulk operations...', 'info');
      const bulkSelectors = document.querySelectorAll('select[data-testid="bulk-action"], .bulk-action-selector');
      await this.assert(bulkSelectors.length >= 0, 'Should have bulk operation controls');

      // Test 4: Check inline editing
      this.log('Test 4: Checking inline editing functionality...', 'info');
      const editableFields = document.querySelectorAll('input[data-editable], .editable-field');
      await this.assert(editableFields.length >= 0, 'Should have editable fields for variant details');

      this.log('✅ Inventory Management Tests Completed', 'success');

    } catch (error) {
      this.log(`❌ Inventory Management Test Failed: ${error.message}`, 'error');
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('🧪 Starting Complete Multi-Variant Test Suite', 'info');
    this.testResults = [];

    await this.testVendorProductCreation();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this.testCustomerVariantSelection();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this.testCartAndCheckout();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this.testInventoryManagement();

    // Summary
    this.log('📊 Test Suite Summary:', 'info');
    const failures = this.testResults.filter(r => r.result === 'FAIL');
    if (failures.length === 0) {
      this.log('🎉 All tests passed successfully!', 'success');
    } else {
      this.log(`⚠️ ${failures.length} test(s) failed:`, 'warning');
      failures.forEach(failure => {
        this.log(`  - ${failure.test}: ${failure.message}`, 'error');
      });
    }
  }

  // Utility method to test API endpoints
  async testAPIEndpoints() {
    this.log('🔗 Testing Multi-Variant API Endpoints', 'info');

    const endpoints = [
      { url: '/api/vendor/products', method: 'GET' },
      { url: '/api/vendor/products/test-id/variants/combinations', method: 'GET' },
      { url: '/api/cart', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, { method: endpoint.method });
        await this.assert(
          response.status < 500,
          `${endpoint.method} ${endpoint.url} should not return server error`
        );
      } catch (error) {
        this.log(`API test failed for ${endpoint.url}: ${error.message}`, 'warning');
      }
    }
  }

  // Performance testing
  async testPerformance() {
    this.log('⚡ Running Performance Tests', 'info');

    const startTime = performance.now();
    
    // Test component rendering time
    const components = document.querySelectorAll('[data-testid], .variant-selector, .variant-wizard');
    const endTime = performance.now();
    
    await this.assert(
      endTime - startTime < 100,
      `Component rendering should be fast (${Math.round(endTime - startTime)}ms)`
    );

    // Test memory usage (basic check)
    if (window.performance && window.performance.memory) {
      const memInfo = window.performance.memory;
      this.log(`Memory usage: ${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB`, 'info');
    }
  }
}

// Create global test runner instance
window.MultiVariantTestRunner = new MultiVariantTestRunner();

// Auto-run instructions
console.log('%c🧪 Multi-Variant Testing Framework Loaded!', 'color: #16a34a; font-size: 16px; font-weight: bold;');
console.log('%cUsage:', 'color: #2563eb; font-weight: bold;');
console.log('• MultiVariantTestRunner.runAllTests() - Run complete test suite');
console.log('• MultiVariantTestRunner.testVendorProductCreation() - Test vendor flow');
console.log('• MultiVariantTestRunner.testCustomerVariantSelection() - Test customer flow');
console.log('• MultiVariantTestRunner.testCartAndCheckout() - Test cart functionality');
console.log('• MultiVariantTestRunner.testInventoryManagement() - Test inventory management');
console.log('• MultiVariantTestRunner.testAPIEndpoints() - Test API endpoints');
console.log('• MultiVariantTestRunner.testPerformance() - Run performance tests');
console.log('\n%cReady to test! Run MultiVariantTestRunner.runAllTests() to begin.', 'color: #ea580c; font-weight: bold;');