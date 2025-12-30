// super7.js
/**
 * Super7.com scraper (browser‑reuse version)
 *
 * Exports
 *   • scrapeSuper7Vari(pageNum = 1) → scrape one page (opens/closes browser itself)
 *   • scrapeSuper7()                → scrape all pages; re‑uses one browser/page
 *   • getSuper7Length()             → get total number of pages
 *
 * When run directly with `node super7.js`, it scrapes all pages and prints JSON.
 */

const { launchBrowser } = require('./_browser');

const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '').trim();

/**
 * Extract product data from the *current* page object.
 *   page   – puppeteer Page already positioned on the collection page
 *   return – array of [name, image, 'Super7', url, price, preOwned, rel]
 */
async function extractFromPage(page) {
  return page.evaluate(() => {
    const cleanInner = txt => (txt || '').replace(/[^\d.]/g, '').trim();

    // Select all product cards - Super7 uses various selectors
    const products = Array.from(document.querySelectorAll('.product-item, .product-card, .grid-item, [data-product-id], .product'))
      .filter(card => {
        // Filter to only actual product items with links
        const link = card.querySelector('a[href*="/products/"]');
        return link !== null;
      });

    return products.map(card => {
      // Extract product name
      const nameEl = card.querySelector('.product-title, .title, h3, h4, .product-item__title, [class*="title"]');
      const name = nameEl ? nameEl.textContent.trim() : '';

      // Extract image URL
      const imgEl = card.querySelector('img[src], img[data-src]');
      let image = '';
      if (imgEl) {
        image = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
        // Handle protocol-relative URLs
        if (image.startsWith('//')) {
          image = 'https:' + image;
        }
        // Remove size parameters to get full image
        image = image.replace(/(_\d+x\d+|\d+x\d+)/g, '');
      }

      // Extract product URL
      const linkEl = card.querySelector('a[href*="/products/"]');
      const url = linkEl ? linkEl.href : '';

      // Extract price - handle both regular and sale prices
      let price = '';
      const priceEl = card.querySelector('.price, .product-price, .sale-price, [class*="price"]');
      if (priceEl) {
        // Look for sale price first, then regular price
        const salePriceEl = priceEl.querySelector('.sale-price, [class*="sale"], .price--sale');
        const regularPriceEl = priceEl.querySelector('.regular-price, .price--regular, .money');

        if (salePriceEl) {
          price = cleanInner(salePriceEl.textContent);
        } else if (regularPriceEl) {
          price = cleanInner(regularPriceEl.textContent);
        } else {
          price = cleanInner(priceEl.textContent);
        }
      }

      // Pre-owned field (not applicable for this store)
      const preOwned = '';

      // Release date/info (check for pre-order, sold out, or other status)
      let rel = '';
      const statusEl = card.querySelector('[class*="pre-order"], [class*="preorder"], [class*="sold-out"], [class*="soldout"]');
      if (statusEl) {
        rel = statusEl.textContent.trim();
      }

      return [name, image, 'Super7', url, price, preOwned, rel];
    }).filter(item => item[0] && item[3]); // Only return items with name and URL
  });
}

/**
 * Get the total number of pages in the collection.
 * @returns {Promise<number>}
 */
async function getSuper7Length() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(1800000);

    await page.goto(
      'https://super7.com/collections/all/?sort_by=created-descending',
      { waitUntil: 'networkidle0' }
    );

    const totalPages = await page.evaluate(() => {
      // Look for pagination elements
      const paginationLinks = Array.from(
        document.querySelectorAll('.pagination a, .pagination__item a, nav a[href*="page="], .pagination-links a')
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
    console.error('Error getting Super7 page count:', error);
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
async function scrapeSuper7Vari(pageNum = 1) {
  if (pageNum < 1) throw new Error('pageNum must be ≥ 1');

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(1800000);

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    const url = pageNum === 1
      ? 'https://super7.com/collections/all/?sort_by=created-descending'
      : `https://super7.com/collections/all/?sort_by=created-descending&page=${pageNum}`;

    console.log(`Scraping page ${pageNum}: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = await extractFromPage(page);
    console.log(`Page ${pageNum}: Found ${data.length} products`);
    return data;
  } catch (error) {
    console.error(`Error scraping Super7 page ${pageNum}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Scrape *all* pages by re‑using one browser & page (faster, no timeouts).
 * @returns {Promise<Array>}
 */
async function scrapeSuper7() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(1800000);

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    const all = [];
    let pageNum = 1;

    while (true) {
      try {
        const url = pageNum === 1
          ? 'https://super7.com/collections/all/?sort_by=created-descending'
          : `https://super7.com/collections/all/?sort_by=created-descending&page=${pageNum}`;

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
        console.error(`Error scraping Super7 page ${pageNum}:`, error);
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
  scrapeSuper7()
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
  scrapeSuper7,
  scrapeSuper7Vari,
  getSuper7Length
};