const puppeteer = require('puppeteer');

async function testWebsite() {
  console.log('Starting website tests...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test 1: Main page
    console.log('\n=== Test 1: Testing main page ===');
    const page1 = await browser.newPage();
    await page1.goto('http://localhost:3008', { waitUntil: 'networkidle0', timeout: 30000 });
    const title1 = await page1.title();
    console.log(`Main page title: ${title1}`);

    // Check for theme classes
    const hasThemeProvider = await page1.evaluate(() => {
      return document.documentElement.classList.contains('dark') ||
             document.documentElement.classList.contains('light') ||
             document.documentElement.hasAttribute('data-theme');
    });
    console.log(`Theme provider present: ${hasThemeProvider}`);

    // Take screenshot
    await page1.screenshot({ path: 'test1-main.png' });
    console.log('Screenshot saved: test1-main.png');

    // Test 2: Theme demo page
    console.log('\n=== Test 2: Testing theme demo page ===');
    const page2 = await browser.newPage();
    await page2.goto('http://localhost:3008/theme-demo', { waitUntil: 'networkidle0', timeout: 30000 });
    const title2 = await page2.title();
    console.log(`Theme demo page title: ${title2}`);

    // Check for Twitter colors
    const primaryColor = await page2.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--primary');
    });
    console.log(`Primary color CSS variable: ${primaryColor}`);

    await page2.screenshot({ path: 'test2-theme-demo.png' });
    console.log('Screenshot saved: test2-theme-demo.png');

    // Test 3: Login page
    console.log('\n=== Test 3: Testing login page ===');
    const page3 = await browser.newPage();
    await page3.goto('http://localhost:3008/login', { waitUntil: 'networkidle0', timeout: 30000 });
    const title3 = await page3.title();
    console.log(`Login page title: ${title3}`);

    // Check for theme styles
    const bgColor = await page3.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).backgroundColor;
    });
    console.log(`Background color: ${bgColor}`);

    await page3.screenshot({ path: 'test3-login.png' });
    console.log('Screenshot saved: test3-login.png');

    console.log('\n=== All tests completed ===');

  } catch (error) {
    console.error('Error during testing:', error.message);

    // Try to get page content if error occurs
    const page = await browser.newPage();
    try {
      const response = await page.goto('http://localhost:3008', { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log(`Response status: ${response?.status()}`);
      const content = await page.content();
      console.log(`Page content length: ${content.length} characters`);
      if (content.includes('Internal Server Error')) {
        console.log('Page shows Internal Server Error');
      }
    } catch (e) {
      console.log('Could not load page:', e.message);
    }
  } finally {
    await browser.close();
  }
}

testWebsite().catch(console.error);