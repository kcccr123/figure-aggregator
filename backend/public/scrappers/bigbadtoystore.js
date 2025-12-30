const { launchBrowser } = require('./_browser');

const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '');

async function scrapeBBTSVari(pageNum = 1) {
  console.log(`Launching browser for BBTS New Arrivals page ${pageNum}...`);
  const browser = await launchBrowser();
  
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(1800000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    // Use the New Arrivals list page
    const searchUrl = pageNum === 1 
      ? 'https://www.bigbadtoystore.com/List/NewArrivals'
      : `https://www.bigbadtoystore.com/List/NewArrivals?page=${pageNum}`;
    
    console.log(`Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 1800000 });
    await page.waitForTimeout(2000);

    const products = await page.evaluate(() => {
      const results = [];
      const productLinks = document.querySelectorAll('a.browse-item, a[href*="/Product/VariationDetails/"]');
      
      productLinks.forEach(link => {
        try {
          const url = link.href;
          if (!url) return;
          
          const nameEl = link.querySelector('h3.browse-item-title, .browse-item-title, [class*="title"]');
          const name = nameEl ? nameEl.textContent.trim() : '';
          if (!name) return;
          
          const imgEl = link.querySelector('img.browse-item-image, img');
          let image = '';
          if (imgEl) {
            image = imgEl.src || imgEl.dataset.src || '';
          }
          
          const price = '';
          const rel = '';
          
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
