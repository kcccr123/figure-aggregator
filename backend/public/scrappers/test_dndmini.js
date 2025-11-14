const { launchBrowser } = require('./_browser');

async function testDnDMini() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    console.log('Navigating to DnDMini...');
    await page.goto('https://www.dndmini.com/collections/all/?sort_by=created-descending', { waitUntil: 'networkidle0' });
    
    console.log('Page loaded, extracting structure...\n');
    
    const structure = await page.evaluate(() => {
      // Find all possible product container classes
      const possibleContainers = [];
      const allDivs = document.querySelectorAll('div[class]');
      
      allDivs.forEach(div => {
        const classes = div.className;
        if (classes && (
          classes.includes('product') || 
          classes.includes('item') || 
          classes.includes('card')
        )) {
          possibleContainers.push(classes);
        }
      });
      
      // Get first 3 products
      const products = [];
      
      // Try different selectors
      const selectors = [
        '.item-product',
        '.product-item',
        '.product-card',
        '[class*="product"]',
        '.card',
        '.grid-item'
      ];
      
      for (const selector of selectors) {
        const items = document.querySelectorAll(selector);
        if (items.length > 0) {
          products.push({
            selector: selector,
            count: items.length,
            sample: items[0] ? {
              html: items[0].outerHTML.substring(0, 500),
              classes: items[0].className
            } : null
          });
        }
      }
      
      return {
        totalElements: document.querySelectorAll('*').length,
        possibleContainers: [...new Set(possibleContainers)].slice(0, 10),
        products: products,
        bodyClass: document.body.className,
        h5Count: document.querySelectorAll('h5').length,
        imgCount: document.querySelectorAll('img').length,
        linkCount: document.querySelectorAll('a').length
      };
    });
    
    console.log('=== PAGE STRUCTURE ===');
    console.log('Total elements:', structure.totalElements);
    console.log('Body class:', structure.bodyClass);
    console.log('H5 tags found:', structure.h5Count);
    console.log('Images found:', structure.imgCount);
    console.log('Links found:', structure.linkCount);
    console.log('\n=== POSSIBLE PRODUCT CONTAINERS ===');
    structure.possibleContainers.forEach(c => console.log('  -', c));
    
    console.log('\n=== PRODUCT SELECTORS TEST ===');
    structure.products.forEach(p => {
      console.log(`\nSelector: "${p.selector}"`);
      console.log(`Count: ${p.count}`);
      if (p.sample) {
        console.log(`Sample classes: ${p.sample.classes}`);
        console.log(`Sample HTML (first 500 chars):\n${p.sample.html}`);
      }
    });
    
  } finally {
    await browser.close();
  }
}

testDnDMini().catch(console.error);
