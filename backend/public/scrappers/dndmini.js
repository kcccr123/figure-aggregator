// dndmini.js
/**
 * DnDMini.com scraper (browser‑reuse version)
 *
 * Exports
 *   • scrapeDnDMiniVari(pageNum = 1) → scrape one page (opens/closes browser itself)
 *   • scrapeDnDMini()                → scrape all pages; re‑uses one browser/page
 *   • getDnDMiniLength()             → get total number of pages
 *
 * When run directly with `node dndmini.js`, it scrapes all pages and prints JSON.
 */

const { launchBrowser } = require('./_browser');

const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '').trim();

/**
 * Extract product data from the *current* page object.
 *   page   – puppeteer Page already positioned on the collection page
 *   return – array of [name, image, 'DnDMini', url, price, preOwned, rel]
 */
async function extractFromPage(page) {
  return page.evaluate(() => {
    const cleanInner = txt => (txt || '').replace(/[^\d.]/g, '').trim();

    // Select all product cards - DnDMini uses .product-grid-item class
    const products = Array.from(document.querySelectorAll('.product-grid-item'));

    return products.map(card => {
      // Extract product name from h5.product-name a
      const nameEl = card.querySelector('h5.product-name a');
      const name = nameEl ? nameEl.textContent.trim() : '';

      // Extract image URL from .product-image img
      const imgEl = card.querySelector('.product-image img');
      let image = '';
      if (imgEl) {
        // Get src attribute
        image = imgEl.getAttribute('src') || '';
        // Handle protocol-relative URLs
        if (image.startsWith('//')) {
          image = 'https:' + image;
        }
        // Remove size parameters to get better quality image
        image = image.replace(/_\d+x\d+\./, '_1024x1024.');
      }

      // Extract product URL from h5.product-name a
      const linkEl = card.querySelector('h5.product-name a');
      let url = linkEl ? linkEl.getAttribute('href') : '';
      if (url && !url.startsWith('http')) {
        url = 'https://www.dndmini.com' + url;
      }

      // Extract price from .product-prices
      let price = '';
      const priceContainer = card.querySelector('.product-prices, .product-price');
      if (priceContainer) {
        // Check for sale price (price-new) or regular price (price-old)
        const newPriceEl = priceContainer.querySelector('.price-new .money, .price-new');
        const oldPriceEl = priceContainer.querySelector('.price-old .money, .price-old');
        const singlePriceEl = priceContainer.querySelector('.money, .price');
        
        if (newPriceEl) {
          // Sale price exists
          price = cleanInner(newPriceEl.textContent);
        } else if (oldPriceEl) {
          // Regular price (might be crossed out if on sale)
          price = cleanInner(oldPriceEl.textContent);
        } else if (singlePriceEl) {
          // Single price
          price = cleanInner(singlePriceEl.textContent);
        }
      }

      // Pre-owned field (not applicable for this store)
      const preOwned = '';

      // Release date/info (check for product labels like "SALE", "PRE-ORDER")
      let rel = '';
      const labelEl = card.querySelector('.product-label');
      if (labelEl) {
        const labelText = labelEl.textContent.trim().toUpperCase();
        if (labelText.includes('PRE') && labelText.includes('ORDER')) {
          rel = 'Pre-Order';
        }
      }

      return [name, image, 'DnDMini', url, price, preOwned, rel];
    }).filter(item => item[0] && item[3]); // Only return items with name and URL
  });
}

/**
 * Get the total number of pages in the collection.
 * @returns {Promise<number>}
 */
async function getDnDMiniLength() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    await page.goto(
      'https://www.dndmini.com/collections/all/?sort_by=created-descending',
      { waitUntil: 'networkidle0' }
    );

    const totalPages = await page.evaluate(() => {
      // Look for pagination elements
      const paginationLinks = Array.from(
        document.querySelectorAll('.pagination a, .pagination__item a, nav a[href*="page="]')
      );

      const pageNumbers = paginationLinks
        .map(a => {
          const match = a.href.match(/[?&]page=(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);

      // Also check for page number text
      const pageTexts = paginationLinks
        .map(a => parseInt(a.textContent.trim(), 10))
        .filter(n => !isNaN(n) && n > 0);

      const allNumbers = [...pageNumbers, ...pageTexts];
      return allNumbers.length ? Math.max(...allNumbers) : 1;
    });

    console.log(`Total pages found: ${totalPages}`);
    return totalPages;
  } catch (error) {
    console.error('Error getting DnDMini page count:', error);
    return 1;
  } finally {
    await browser.close();
  }
}

/**
 * Scrape a single page of results (opens and closes its own browser).
 * @param {number} pageNum - Page number to scrape (1-indexed)
 * @returns {Promise<Array>}
 */
async function scrapeDnDMiniVari(pageNum = 1) {
  if (pageNum < 1) throw new Error('pageNum must be ≥ 1');
  
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    const url = pageNum === 1 
      ? 'https://www.dndmini.com/collections/all/?sort_by=created-descending'
      : `https://www.dndmini.com/collections/all/?sort_by=created-descending&page=${pageNum}`;
    
    console.log(`Scraping page ${pageNum}: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    const data = await extractFromPage(page);
    console.log(`Page ${pageNum}: Found ${data.length} products`);
    return data;
  } catch (error) {
    console.error(`Error scraping DnDMini page ${pageNum}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Scrape *all* pages by re‑using one browser & page (faster, no timeouts).
 * @returns {Promise<Array>}
 */
async function scrapeDnDMini() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    const all = [];
    let pageNum = 1;

    while (true) {
      try {
        const url = pageNum === 1 
          ? 'https://www.dndmini.com/collections/all/?sort_by=created-descending'
          : `https://www.dndmini.com/collections/all/?sort_by=created-descending&page=${pageNum}`;
        
        console.log(`Scraping page ${pageNum}: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle0' });

        const results = await extractFromPage(page);
        console.log(`Page ${pageNum}: Found ${results.length} products`);

        if (!results.length) {
          console.log('No more products found, stopping.');
          break; // Empty page → we're done
        }
        
        all.push(...results);
        pageNum++;

        // Optional: Add a small delay to be respectful to the server
        await page.waitForTimeout(1000);
      } catch (error) {
        console.error(`Error scraping DnDMini page ${pageNum}:`, error);
        break; // Stop on error
      }
    }
    
    console.log(`Total products scraped: ${all.length}`);
    return all;
  } finally {
    await browser.close();
  }
}

// If run directly, scrape all pages and print JSON
if (require.main === module) {
  scrapeDnDMini()
    .then(data => {
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { 
  scrapeDnDMini, 
  scrapeDnDMiniVari, 
  getDnDMiniLength 
};
