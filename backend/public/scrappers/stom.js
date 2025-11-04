const { launchBrowser } = require('./_browser');

const cleanPrice = txt => (txt || '').replace(/[^\d.]/g, '');
const resolveImg = el => {
  const attrs = ['data-src', 'data-lazy-src', 'data-original', 'srcset', 'src'];
  for (const a of attrs) {
    let v = el.getAttribute(a);
    if (!v) continue;
    if (a === 'srcset') v = v.split(/\s+/)[0];
    if (!v.startsWith('data:')) return v.startsWith('//') ? `https:${v}` : v;
  }
  return '';
};

function browserExtract(resolveStr, priceFnStr) {
  const $$ = sel => document.querySelector(sel);
  const imgFn   = new Function('el', `return (${resolveStr})(el);`);
  const priceFn = new Function('t',  `return (${priceFnStr})(t);`);

  const arr = [];

  const name =
    ($$('#shopMainArea h1 span')?.textContent.trim() ||
     $$('h1 span')?.textContent.trim() ||
     $$('h1')?.textContent.trim() ||
     '');
  arr.push(name);

  const imgEl =
    document.querySelector('.js-magnifier-0,.js-slick-image') ||
    document.querySelector('.c-product-main__image img')       ||
    document.querySelector('#productPhotos img')               ||
    document.querySelector('img[alt][src]');
  arr.push(imgEl ? imgFn(imgEl) : '');

  arr.push('TokyoOtakuMode');  

  const priceNode =
    $$('#shopMainArea .p-price__offscreen') ||
    $$('#shopMainArea .p-price__price span') ||
    $$('[itemprop="price"]');
  arr.push(priceFn(priceNode?.textContent || priceNode?.content || null)); // index 4

  arr.push('');  

  const rel =
    ($$('#shopMainArea .p-product-detail__release-month a')?.textContent.trim() ||
     $$('time[itemprop="releaseDate"]')?.textContent.trim() || '');
  arr.push(rel); 

  return arr;
}

async function getSTOMlen() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    await page.goto(
      'https://otakumode.com/shop/new_items?category=figures-dolls',
      { waitUntil: 'networkidle0' }
    );

    const len = await page.evaluate(() => {
      const nums = Array.from(
        document.querySelectorAll('nav.pagination a, ul.pagination li a')
      )
        .map(a => parseInt(a.textContent.trim(), 10))
        .filter(Boolean);
      return nums.length ? Math.max(...nums) : 1;
    });

    return len;
  } catch (error) {
    console.error('Error getting STOM length:', error);
    return 1;
  } finally {
    await browser.close();
  }
}

async function scrapeTOM() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    const totalPages = await getSTOMlen();
    const allProducts = [];

    for (let z = 1; z <= totalPages; z++) {
      try {
        console.log(z);   // same as original

        await page.goto(
          `https://otakumode.com/shop/new_items?category=figures-dolls&page=${z}`,
          { waitUntil: 'networkidle0' }
        );

        const productLinks = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              'a.p-product-list__thumb,a.c-product__thumb,a[href*="/products/"]'
            )
          ).map(a => a.href)
        );

        for (const url of productLinks) {
          try {
            await page.goto(url, { waitUntil: 'networkidle0' });

            const product = await page.evaluate(
              browserExtract,
              resolveImg.toString(),
              cleanPrice.toString()
            );
            product.splice(3, 0, url); // insert URL at index 3

            console.log(product);      // same as original
            allProducts.push(product);
          } catch (error) {
            console.error(`Error scraping product ${url}:`, error);
            // Skip this product
          }
        }
      } catch (error) {
        console.error(`Error scraping STOM page ${z}:`, error);
        // Skip this page
      }
    }

    return allProducts;
  } finally {
    await browser.close();
  }
}

async function scrapeTOMVari(pageNum) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    const pageURL =
      `https://otakumode.com/shop/new_items?category=figures-dolls&page=${pageNum}`;
    await page.goto(pageURL, { waitUntil: 'networkidle0' });

    const productLinks = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          'a.p-product-list__thumb,a.c-product__thumb,a[href*="/products/"]'
        )
      ).map(a => a.href)
    );

    const results = [];
    for (const url of productLinks) {
      try {
        await page.goto(url, { waitUntil: 'networkidle0' });
        const product = await page.evaluate(
          browserExtract,
          resolveImg.toString(),
          cleanPrice.toString()
        );
        product.splice(3, 0, url);
        results.push(product);
      } catch (error) {
        console.error(`Error scraping product ${url}:`, error);
        // Skip this product
      }
    }

    return results;
  } catch (error) {
    console.error(`Error scraping STOM page ${pageNum}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeTOM, getSTOMlen, scrapeTOMVari };

//scrapeTOM()
