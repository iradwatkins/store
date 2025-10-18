const { chromium } = require('playwright');

async function testWithPlaywright(testNumber) {
  console.log(`\n========== PLAYWRIGHT TEST RUN ${testNumber} ==========`);
  console.log('Starting Playwright website tests...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext();

    // Test 1: Main page
    console.log('\n=== Test 1: Testing main page (http://localhost:3008) ===');
    const page1 = await context.newPage();

    // Listen for console messages
    page1.on('console', msg => console.log('  Console:', msg.text()));
    page1.on('pageerror', err => console.log('  Page Error:', err.message));

    try {
      const response1 = await page1.goto('http://localhost:3008', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log(`  Response status: ${response1.status()}`);
      console.log(`  Response URL: ${response1.url()}`);

      // Get page content
      const content1 = await page1.content();
      console.log(`  Page content length: ${content1.length} characters`);

      // Check for error messages
      const bodyText = await page1.textContent('body');
      if (bodyText.includes('Internal Server Error')) {
        console.log('  ❌ Page shows Internal Server Error');
        console.log(`  Body text: ${bodyText.substring(0, 200)}...`);
      } else {
        console.log('  ✅ No Internal Server Error');

        // Check for theme variables
        const hasTheme = await page1.evaluate(() => {
          const html = document.documentElement;
          const styles = getComputedStyle(html);
          return {
            hasClass: html.classList.contains('dark') || html.classList.contains('light'),
            dataTheme: html.getAttribute('data-theme'),
            primaryColor: styles.getPropertyValue('--primary'),
            backgroundColor: getComputedStyle(document.body).backgroundColor,
            twitterBlue: styles.getPropertyValue('--primary') === '203 89% 53%'
          };
        });
        console.log(`  Theme check:`, hasTheme);

        const title1 = await page1.title();
        console.log(`  Page title: "${title1}"`);
      }

      await page1.screenshot({ path: `playwright-test${testNumber}-1-main.png` });
      console.log(`  Screenshot saved: playwright-test${testNumber}-1-main.png`);
    } catch (error) {
      console.log(`  ❌ Error loading main page: ${error.message}`);
    }

    // Test 2: Theme demo page
    console.log('\n=== Test 2: Testing theme demo page (http://localhost:3008/theme-demo) ===');
    const page2 = await context.newPage();

    page2.on('console', msg => console.log('  Console:', msg.text()));
    page2.on('pageerror', err => console.log('  Page Error:', err.message));

    try {
      const response2 = await page2.goto('http://localhost:3008/theme-demo', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log(`  Response status: ${response2.status()}`);

      const content2 = await page2.content();
      console.log(`  Page content length: ${content2.length} characters`);

      if (response2.status() === 200) {
        const title2 = await page2.title();
        console.log(`  Page title: "${title2}"`);

        // Check for Twitter theme elements
        const themeElements = await page2.evaluate(() => {
          const styles = getComputedStyle(document.documentElement);
          return {
            primary: styles.getPropertyValue('--primary'),
            background: styles.getPropertyValue('--background'),
            foreground: styles.getPropertyValue('--foreground'),
            twitterButtons: document.querySelectorAll('.btn-twitter').length,
            themeToggle: !!document.querySelector('[aria-label*="theme"]')
          };
        });
        console.log(`  Theme elements:`, themeElements);
      } else if (response2.status() === 404) {
        console.log('  ⚠️ Page not found (404)');
      } else {
        console.log('  ❌ Unexpected response status');
      }

      await page2.screenshot({ path: `playwright-test${testNumber}-2-theme-demo.png` });
      console.log(`  Screenshot saved: playwright-test${testNumber}-2-theme-demo.png`);
    } catch (error) {
      console.log(`  ❌ Error loading theme demo: ${error.message}`);
    }

    // Test 3: Login page
    console.log('\n=== Test 3: Testing login page (http://localhost:3008/login) ===');
    const page3 = await context.newPage();

    page3.on('console', msg => console.log('  Console:', msg.text()));
    page3.on('pageerror', err => console.log('  Page Error:', err.message));

    try {
      const response3 = await page3.goto('http://localhost:3008/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log(`  Response status: ${response3.status()}`);

      const content3 = await page3.content();
      console.log(`  Page content length: ${content3.length} characters`);

      if (response3.status() === 200) {
        const title3 = await page3.title();
        console.log(`  Page title: "${title3}"`);

        // Check for form elements and theme
        const loginElements = await page3.evaluate(() => {
          const styles = getComputedStyle(document.documentElement);
          return {
            hasEmailInput: !!document.querySelector('input[type="email"]'),
            hasPasswordInput: !!document.querySelector('input[type="password"]'),
            hasSubmitButton: !!document.querySelector('button[type="submit"]'),
            backgroundColor: getComputedStyle(document.body).backgroundColor,
            primaryColor: styles.getPropertyValue('--primary')
          };
        });
        console.log(`  Login page elements:`, loginElements);
      }

      await page3.screenshot({ path: `playwright-test${testNumber}-3-login.png` });
      console.log(`  Screenshot saved: playwright-test${testNumber}-3-login.png`);
    } catch (error) {
      console.log(`  ❌ Error loading login page: ${error.message}`);
    }

    console.log('\n=== Test completed ===');

  } catch (error) {
    console.error('Error during Playwright testing:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
}

// Run 3 tests as requested
async function runAllPlaywrightTests() {
  // Check if playwright is installed
  try {
    require('playwright');
  } catch (error) {
    console.error('❌ Playwright is not installed. Please run: npm install playwright');
    process.exit(1);
  }

  for (let i = 1; i <= 3; i++) {
    await testWithPlaywright(i);
    if (i < 3) {
      console.log('\nWaiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.log('\n========== ALL 3 PLAYWRIGHT TEST RUNS COMPLETED ==========');
}

runAllPlaywrightTests().catch(console.error);