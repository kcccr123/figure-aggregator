const { launchBrowser } = require('./_browser');

const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '');

/**
 * Extract product data from the *current* product page object.
 *   page   – puppeteer Page already positioned on the product page
 *   return – array of [name, image, 'BigBadToyStore', url, price, preowned, rel]
 */
async function extractFromProductPage(page) {
  return page.evaluate(() => {
    const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '');
    const name = document.querySelector('h1.product-name-ada')?.textContent.trim() || '';
    const image = document.querySelector('#img0')?.src || '';
    const priceText = document.querySelector('.price')?.textContent.trim() || '';
    const price = cleanPrice(priceText);
    const preowned = '';
    const rel = document.querySelector('.preorder-arrival strong')?.textContent.trim() || '';

    return [name, image, 'BigBadToyStore', window.location.href, price, preowned, rel];
  });
}

async function scrapeBBTSVari(pageNum = 1) {
  console.log(`Launching browser for page ${pageNum}...`);
  const browser = await launchBrowser();
  console.log('Browser launched.');
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    console.log('Page created.');

    const searchUrl = `https://www.bigbadtoystore.com/Search?HideInStock=false&HidePreorder=false&HideSoldOut=false&InventoryStatus=i,p,so&PageSize=20&SortOrder=New&Department=43623&PageIndex=${pageNum}`;
    console.log(`Going to ${searchUrl}...`);
    await page.goto(searchUrl, { waitUntil: 'networkidle0' });
    console.log('Page loaded.');

    const productLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a.product-card')).map(a => a.href)
    );
    const uniqueLinks = [...new Set(productLinks)];
    console.log(`Found ${productLinks.length} product links.`);

    const results = [];
    for (const url of uniqueLinks) {
      try {
        console.log(`Visiting ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle0' });

        const product = await extractFromProductPage(page);
        results.push(product);
        console.log(`Extracted: ${product[0]}`);
      } catch (error) {
        console.error(`Error scraping product ${url}:`, error);
        // Skip this product
      }
    }

    console.log(`Returning ${results.length} results.`);
    return results;
  } catch (error) {
    console.error(`Error scraping BBTS page ${pageNum}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeBBTSVari };
