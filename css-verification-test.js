const { chromium } = require('playwright');

async function captureScreenshot() {
  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://72.60.28.175:3014...');
    
    // Set viewport for consistent screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to the application
    await page.goto('http://72.60.28.175:3014', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Page loaded, waiting for content to render...');
    
    // Wait for the page to be fully loaded and styled
    await page.waitForTimeout(3000);
    
    // Check if the page loaded successfully
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for any error messages
    const errorElements = await page.$$('text="Error"');
    const errorCount = errorElements.length;
    console.log(`Error elements found: ${errorCount}`);
    
    // Check for common e-commerce elements
    const navElements = await page.$$('nav, .navbar, [role="navigation"]');
    const buttonElements = await page.$$('button');
    const linkElements = await page.$$('a');
    
    console.log(`Navigation elements: ${navElements.length}`);
    console.log(`Button elements: ${buttonElements.length}`);
    console.log(`Link elements: ${linkElements.length}`);
    
    // Take the screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'css-success-verification.png',
      fullPage: true
    });
    
    console.log('Screenshot saved as css-success-verification.png');
    
    // Get some basic page information for analysis
    const bodyHTML = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 1000); // First 1000 chars
    });
    
    console.log('Page content preview:', bodyHTML.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error during screenshot capture:', error);
    
    // Still try to take a screenshot even if there's an error
    try {
      await page.screenshot({ 
        path: 'css-success-verification.png',
        fullPage: true
      });
      console.log('Emergency screenshot saved');
    } catch (screenshotError) {
      console.error('Failed to take emergency screenshot:', screenshotError);
    }
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

captureScreenshot().catch(console.error);