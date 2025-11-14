const { launchBrowser } = require('./_browser');

const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '');

/**
 * Scrape BBTS search page directly without visiting individual product pages
 */
async function scrapeBBTSVari(pageNum = 1) {
  console.log(`Launching browser for BBTS page ${pageNum}...`);
  const browser = await launchBrowser();
  
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    const searchUrl = `https://www.bigbadtoystore.com/Search?HideInStock=false&HidePreorder=false&HideSoldOut=false&InventoryStatus=i,p,so&PageSize=20&SortOrder=New&Department=43623&PageIndex=${pageNum}`;
    console.log(`Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForTimeout(2000); // Wait for page to fully load
    
    console.log('Extracting products from search page...');

    // Extract all product data directly from the search page
    const products = await page.evaluate(() => {
      const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '');
      const results = [];
      
      // Find all product cards (try multiple selectors)
      const productCards = document.querySelectorAll('a.product-card, .product-card, [class*="product-card"]');
      
      productCards.forEach(card => {
        try {
          // Get product URL
          const url = card.href || card.querySelector('a')?.href || '';
          if (!url) return;
          
          // Get product name
          const nameEl = card.querySelector('.product-name, [class*="product-name"], h3, h4, .title');
          const name = nameEl ? nameEl.textContent.trim() : '';
          if (!name) return;
          
          // Get image
          const imgEl = card.querySelector('img');
          let image = '';
          if (imgEl) {
            image = imgEl.src || imgEl.dataset.src || '';
            if (image && !image.startsWith('http')) {
              image = 'https://www.bigbadtoystore.com' + image;
            }
          }
          
          // Get price
          const priceEl = card.querySelector('.price, [class*="price"]');
          const priceText = priceEl ? priceEl.textContent.trim() : '';
          const price = cleanPrice(priceText);
          
          // Get preorder/release info
          let rel = '';
          const preorderEl = card.querySelector('[class*="preorder"], [class*="pre-order"], .badge, [class*="badge"]');
          if (preorderEl) {
            const text = preorderEl.textContent.trim();
            if (text.toLowerCase().includes('preorder') || text.toLowerCase().includes('pre-order')) {
              rel = text;
            }
          }
          
          results.push([name, image, 'BigBadToyStore', url, price, '', rel]);
        } catch (err) {
          console.error('Error extracting product:', err);
        }
      });
      
      return results;
    });

    console.log(`Extracted ${products.length} products from page ${pageNum}`);
    return products;
    
  } catch (error) {
    console.error(`Error scraping BBTS page ${pageNum}:`, error.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeBBTSVari };
