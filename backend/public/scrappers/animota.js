// animota.js
/**
 * Animota.net scraper - scrapes ALL collections
 *
 * Exports
 *   • scrapeAnimotaVari(pageNum = 1) → scrape page from ALL collections (opens/closes browser)
 *   • scrapeAnimota()                → scrape all collections, all pages; re‑uses one browser/page
 *   • getCollections()               → get list of all collection URLs
 *
 * When run directly with `node animota.js`, it scrapes all collections and prints JSON.
 */

const { launchBrowser } = require('./_browser');

const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '').trim();

/**
 * Get all collection URLs from the main collections page
 * @returns {Promise<Array<string>>}
 */
async function getCollections() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(1800000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    console.log('Fetching all collections from https://animota.net/collections/');
    await page.goto('https://animota.net/collections/', { waitUntil: 'networkidle0' });

    const collections = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/collections/"]'));
      const collectionUrls = links
        .map(a => a.href)
        .filter(href => {
          // Filter out the main collections page and search links
          return href.includes('/collections/') && 
                 !href.endsWith('/collections/') &&
                 !href.includes('/search?');
        })
        .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
      
      return collectionUrls;
    });

    console.log(`Found ${collections.length} collections`);
    return collections;
  } catch (error) {
    console.error('Error getting collections:', error);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Extract product data from the *current* collection page object.
 *   page   – puppeteer Page already positioned on the collection page
 *   return – array of [name, image, 'Animota', url, price, preOwned, rel]
 */
async function extractFromPage(page) {
  return page.evaluate(() => {
    const cleanInner = txt => (txt || '').replace(/[^\d.]/g, '').trim();

    // Select all product cards - Animota uses .card class
    const products = Array.from(document.querySelectorAll('.card'))
      .filter(card => {
        // Filter to only product cards with links (not cart notifications or other cards)
        const link = card.querySelector('a[href*="/products/"]');
        return link !== null;
      });

    return products.map(card => {
      // Extract product URL
      const linkEl = card.querySelector('a[href*="/products/"]');
      const url = linkEl ? linkEl.href : '';
      
      // Extract product name - look in the card wrapper or nearby elements
      const cardWrapper = card.closest('.card-wrapper, li, .grid__item');
      const nameEl = cardWrapper 
        ? cardWrapper.querySelector('.card__heading a, .card-information__text a, h3 a, a.full-unstyled-link')
        : card.querySelector('.card__heading a, .card-information__text a, h3 a');
      const name = nameEl ? nameEl.textContent.trim() : '';

      // Extract image URL
      const imgEl = card.querySelector('img[src], img[srcset]');
      let image = '';
      if (imgEl) {
        // Get highest quality image from srcset or src
        const srcset = imgEl.getAttribute('srcset');
        if (srcset) {
          const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
          image = sources[sources.length - 1]; // Get highest resolution
        } else {
          image = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
        }
        
        // Handle protocol-relative URLs
        if (image.startsWith('//')) {
          image = 'https:' + image;
        }
        // Remove size parameters
        image = image.replace(/&width=\d+/g, '');
      }

      // Extract price - look in card wrapper
      let price = '';
      const priceContainer = cardWrapper || card;
      const priceEl = priceContainer.querySelector('.price, .price-item, .money, [class*="price"]');
      if (priceEl) {
        // Look for sale price first, then regular price
        const salePriceEl = priceEl.querySelector('.price--on-sale, .price-item--sale');
        const regularPriceEl = priceEl.querySelector('.price-item--regular');
        
        if (salePriceEl) {
          price = cleanInner(salePriceEl.textContent);
        } else if (regularPriceEl) {
          price = cleanInner(regularPriceEl.textContent);
        } else {
          price = cleanInner(priceEl.textContent);
        }
      }

      // Pre-owned field (not applicable)
      const preOwned = '';

      // Release date/info
      let rel = '';
      const statusEl = cardWrapper 
        ? cardWrapper.querySelector('[class*="pre-order"], [class*="preorder"], [class*="badge"]')
        : null;
      if (statusEl) {
        rel = statusEl.textContent.trim();
      }

      return [name, image, 'Animota', url, price, preOwned, rel];
    }).filter(item => item[0] && item[3]); // Only return items with name and URL
  });
}

/**
 * Get the total number of pages in a specific collection.
 * @param {string} collectionUrl - The collection URL
 * @returns {Promise<number>}
 */
async function getCollectionPageCount(collectionUrl, page) {
  try {
    const url = collectionUrl.includes('?') 
      ? `${collectionUrl}&sort_by=created-descending`
      : `${collectionUrl}?sort_by=created-descending`;
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 1800000 });

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

    return totalPages;
  } catch (error) {
    console.error(`Error getting page count for ${collectionUrl}:`, error.message);
    return 1;
  }
}

/**
 * Scrape a single "aggregated page" - combines page N from ALL collections
 * @param {number} pageNum - Page number to scrape from each collection (1-indexed)
 * @returns {Promise<Array>}
 */
async function scrapeAnimotaVari(pageNum = 1) {
  if (pageNum < 1) throw new Error('pageNum must be ≥ 1');

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(1800000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    // Get all collections using the same browser
    console.log(`Getting all collections...`);
    await page.goto('https://animota.net/collections/', { waitUntil: 'networkidle0' });
    
    const collections = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/collections/"]'));
      const collectionUrls = links
        .map(a => a.href)
        .filter(href => {
          // Filter out the main collections page and search links
          return href.includes('/collections/') && 
                 !href.endsWith('/collections/') &&
                 !href.includes('/search?');
        })
        .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
      
      return collectionUrls;
    });
    
    if (collections.length === 0) {
      console.log('No collections found');
      return [];
    }

    console.log(`Scraping page ${pageNum} from ${collections.length} collections`);
    const allResults = [];

    for (let i = 0; i < collections.length; i++) {
      const collectionUrl = collections[i];
      const collectionName = collectionUrl.split('/collections/')[1] || `collection-${i}`;
      
      try {
        // Build URL with page number and sort filter
        const url = collectionUrl.includes('?')
          ? `${collectionUrl}&page=${pageNum}&sort_by=created-descending`
          : `${collectionUrl}?page=${pageNum}&sort_by=created-descending`;

        console.log(`[${i + 1}/${collections.length}] ${collectionName} - page ${pageNum}`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.waitForTimeout(1000); // Small delay

        const products = await extractFromPage(page);
        console.log(`  Found ${products.length} products`);
        
        if (products.length > 0) {
          allResults.push(...products);
        }
      } catch (error) {
        console.error(`  Error scraping ${collectionName}:`, error.message);
      }
    }

    console.log(`Total products from page ${pageNum}: ${allResults.length}`);
    return allResults;
  } catch (error) {
    console.error(`Error in scrapeAnimotaVari page ${pageNum}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Scrape *all* collections, *all* pages by re‑using one browser & page (faster, no timeouts).
 * @returns {Promise<Array>}
 */
async function scrapeAnimota() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(1800000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    // Get all collections first using the same browser
    console.log('Getting all collections...');
    await page.goto('https://animota.net/collections/', { waitUntil: 'networkidle0' });
    
    const collections = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/collections/"]'));
      const collectionUrls = links
        .map(a => a.href)
        .filter(href => {
          return href.includes('/collections/') && 
                 !href.endsWith('/collections/') &&
                 !href.includes('/search?');
        })
        .filter((url, index, self) => self.indexOf(url) === index);
      return collectionUrls;
    });
    
    console.log(`Found ${collections.length} collections to scrape\n`);

    const allProducts = [];

    for (let i = 0; i < collections.length; i++) {
      const collectionUrl = collections[i];
      const collectionName = collectionUrl.split('/collections/')[1] || `collection-${i}`;
      
      console.log(`[${i + 1}/${collections.length}] Scraping collection: ${collectionName}`);

      try {
        let pageNum = 1;
        let collectionProducts = 0;

        while (true) {
          try {
            // Build URL with page number and sort by newest
            const url = collectionUrl.includes('?')
              ? `${collectionUrl}&page=${pageNum}&sort_by=created-descending`
              : `${collectionUrl}?page=${pageNum}&sort_by=created-descending`;

            await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
            await page.waitForTimeout(1000); // Small delay to be respectful

            const results = await extractFromPage(page);
            console.log(`  Page ${pageNum}: Found ${results.length} products`);

            if (!results.length) {
              console.log(`  No more products, moving to next collection\n`);
              break; // Empty page → move to next collection
            }

            allProducts.push(...results);
            collectionProducts += results.length;
            pageNum++;

          } catch (error) {
            console.error(`  Error on page ${pageNum}:`, error.message);
            break; // Move to next collection on error
          }
        }

        console.log(`  Collection total: ${collectionProducts} products\n`);

      } catch (error) {
        console.error(`Error scraping collection ${collectionName}:`, error.message);
      }
    }

    console.log(`\nTotal products scraped from all collections: ${allProducts.length}`);
    return allProducts;
  } finally {
    await browser.close();
  }
}

// If run directly, scrape all collections and print JSON
if (require.main === module) {
  scrapeAnimota()
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
  scrapeAnimota, 
  scrapeAnimotaVari, 
  getCollections
};