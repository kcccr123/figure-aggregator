const { launchBrowser } = require('./_browser');

async function testDnDMini() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    console.log('Navigating to DnDMini...');
    await page.goto('https://www.dndmini.com/collections/all/?sort_by=created-descending', { waitUntil: 'networkidle0' });
    
    console.log('Page loaded, extracting first product details...\n');
    
    const firstProduct = await page.evaluate(() => {
      const product = document.querySelector('.product-grid-item');
      if (!product) return { error: 'No product found' };
      
      return {
        outerHTML: product.outerHTML,
        nameElement: product.querySelector('h5')?.outerHTML || 'NOT FOUND',
        linkElement: product.querySelector('a')?.outerHTML.substring(0, 300) || 'NOT FOUND',
        imageElement: product.querySelector('img')?.outerHTML || 'NOT FOUND',
        priceElement: product.querySelector('.price')?.outerHTML || 'NOT FOUND',
        allClasses: Array.from(product.querySelectorAll('*')).map(el => el.className).filter(c => c).slice(0, 20)
      };
    });
    
    console.log('=== FIRST PRODUCT STRUCTURE ===\n');
    console.log('NAME element:', firstProduct.nameElement);
    console.log('\nLINK element:', firstProduct.linkElement);
    console.log('\nIMAGE element:', firstProduct.imageElement);
    console.log('\nPRICE element:', firstProduct.priceElement);
    console.log('\nAll classes in product:', firstProduct.allClasses);
    
  } finally {
    await browser.close();
  }
}

testDnDMini().catch(console.error);
