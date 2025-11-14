const { launchBrowser } = require('./_browser');

async function testAnimotaDOM() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    console.log('Loading ONE PIECE collection page...');
    await page.goto('https://animota.net/collections/one-piece?sort_by=created-descending', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000); // Wait for JS to load
    
    console.log('Analyzing DOM structure...\n');
    
    const structure = await page.evaluate(() => {
      // Try various selectors
      const selectors = [
        '.product-item',
        '.product-card',
        '.grid-item',
        '[data-product-id]',
        '.product',
        '.collection-item',
        'article',
        '[class*="product"]',
        '.card',
        'li[class*="product"]'
      ];
      
      const results = {};
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results[selector] = {
            count: elements.length,
            firstElement: {
              html: elements[0].outerHTML.substring(0, 500),
              classes: elements[0].className,
              hasProductLink: !!elements[0].querySelector('a[href*="/products/"]'),
              hasImage: !!elements[0].querySelector('img'),
              hasPrice: !!elements[0].textContent.match(/\$\d+/)
            }
          };
        }
      });
      
      return results;
    });
    
    console.log('=== DOM STRUCTURE RESULTS ===\n');
    Object.entries(structure).forEach(([selector, data]) => {
      console.log(`Selector: "${selector}"`);
      console.log(`  Count: ${data.count}`);
      console.log(`  Classes: ${data.firstElement.classes}`);
      console.log(`  Has product link: ${data.firstElement.hasProductLink}`);
      console.log(`  Has image: ${data.firstElement.hasImage}`);
      console.log(`  Has price: ${data.firstElement.hasPrice}`);
      console.log(`  HTML sample:\n${data.firstElement.html}\n`);
    });
    
  } finally {
    await browser.close();
  }
}

testAnimotaDOM().catch(console.error);
