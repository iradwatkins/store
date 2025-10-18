const puppeteer = require('puppeteer');

async function testWebsite(testNumber) {
  console.log(`\n========== TEST RUN ${testNumber} ==========`);
  console.log('Starting website tests...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test 1: Main page
    console.log('\n=== Test 1: Testing main page (http://localhost:3008) ===');
    const page1 = await browser.newPage();

    // Listen for console messages
    page1.on('console', msg => console.log('  Console:', msg.text()));
    page1.on('error', err => console.log('  Error:', err.message));
    page1.on('pageerror', err => console.log('  Page Error:', err.message));

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
    if (content1.includes('Internal Server Error')) {
      console.log('  ❌ Page shows Internal Server Error');
      // Get more details
      const bodyText = await page1.evaluate(() => document.body.innerText);
      console.log(`  Body text: ${bodyText.substring(0, 200)}...`);
    } else if (content1.includes('Application error')) {
      console.log('  ❌ Page shows Application error');
      const errorText = await page1.evaluate(() => {
        const errorEl = document.querySelector('[data-nextjs-error]');
        return errorEl ? errorEl.innerText : 'No error element found';
      });
      console.log(`  Error details: ${errorText}`);
    } else {
      console.log('  ✅ No obvious error messages');

      // Check for theme
      const hasTheme = await page1.evaluate(() => {
        const html = document.documentElement;
        return {
          hasClass: html.classList.contains('dark') || html.classList.contains('light'),
          dataTheme: html.getAttribute('data-theme'),
          primaryColor: getComputedStyle(html).getPropertyValue('--primary'),
          backgroundColor: getComputedStyle(document.body).backgroundColor
        };
      });
      console.log(`  Theme check:`, hasTheme);

      const title1 = await page1.title();
      console.log(`  Page title: "${title1}"`);
    }

    await page1.screenshot({ path: `test${testNumber}-1-main.png` });
    console.log(`  Screenshot saved: test${testNumber}-1-main.png`);

    // Test 2: Theme demo page
    console.log('\n=== Test 2: Testing theme demo page (http://localhost:3008/theme-demo) ===');
    const page2 = await browser.newPage();

    page2.on('console', msg => console.log('  Console:', msg.text()));
    page2.on('error', err => console.log('  Error:', err.message));
    page2.on('pageerror', err => console.log('  Page Error:', err.message));

    const response2 = await page2.goto('http://localhost:3008/theme-demo', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log(`  Response status: ${response2.status()}`);

    const content2 = await page2.content();
    console.log(`  Page content length: ${content2.length} characters`);

    if (content2.includes('404') || content2.includes('not found')) {
      console.log('  ⚠️ Page might be 404');
    }

    if (response2.status() === 200) {
      const title2 = await page2.title();
      console.log(`  Page title: "${title2}"`);

      // Check for Twitter colors
      const colors = await page2.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
          primary: styles.getPropertyValue('--primary'),
          background: styles.getPropertyValue('--background'),
          foreground: styles.getPropertyValue('--foreground')
        };
      });
      console.log(`  CSS Variables:`, colors);
    }

    await page2.screenshot({ path: `test${testNumber}-2-theme-demo.png` });
    console.log(`  Screenshot saved: test${testNumber}-2-theme-demo.png`);

    // Test 3: Login page
    console.log('\n=== Test 3: Testing login page (http://localhost:3008/login) ===');
    const page3 = await browser.newPage();

    page3.on('console', msg => console.log('  Console:', msg.text()));
    page3.on('error', err => console.log('  Error:', err.message));
    page3.on('pageerror', err => console.log('  Page Error:', err.message));

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

      // Check for form elements
      const hasLoginForm = await page3.evaluate(() => {
        return {
          hasEmailInput: !!document.querySelector('input[type="email"]'),
          hasPasswordInput: !!document.querySelector('input[type="password"]'),
          hasSubmitButton: !!document.querySelector('button[type="submit"]')
        };
      });
      console.log(`  Login form elements:`, hasLoginForm);
    }

    await page3.screenshot({ path: `test${testNumber}-3-login.png` });
    console.log(`  Screenshot saved: test${testNumber}-3-login.png`);

    console.log('\n=== Test completed ===');

  } catch (error) {
    console.error('Error during testing:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
}

// Run 3 tests as requested
async function runAllTests() {
  for (let i = 1; i <= 3; i++) {
    await testWebsite(i);
    if (i < 3) {
      console.log('\nWaiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.log('\n========== ALL 3 TEST RUNS COMPLETED ==========');
}

runAllTests().catch(console.error);