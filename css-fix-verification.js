const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to http://72.60.28.175:3014...');
    
    // Navigate to the URL with increased timeout
    await page.goto('http://72.60.28.175:3014', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'css-fix-verification.png',
      fullPage: true
    });
    
    console.log('Screenshot saved as css-fix-verification.png');
    
    // Get page title and some basic info for verification
    const title = await page.title();
    const url = page.url();
    
    console.log(`Page title: ${title}`);
    console.log(`Final URL: ${url}`);
    
    // Check if there are any obvious layout elements
    const hasMainContent = await page.locator('main, .main, #main, .container, .content').count();
    const hasNavigation = await page.locator('nav, .nav, .navigation, header').count();
    const hasSVGElements = await page.locator('svg').count();
    
    console.log(`Main content elements found: ${hasMainContent}`);
    console.log(`Navigation elements found: ${hasNavigation}`);
    console.log(`SVG elements found: ${hasSVGElements}`);
    
  } catch (error) {
    console.error('Error occurred:', error.message);
    
    // Try to take a screenshot even if there was an error
    try {
      await page.screenshot({ 
        path: 'css-fix-verification-error.png',
        fullPage: true
      });
      console.log('Error screenshot saved as css-fix-verification-error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();