const { launchBrowser } = require('./_browser');

async function testExtract() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.goto('https://www.dndmini.com/collections/all/?sort_by=created-descending', { waitUntil: 'networkidle0' });
    
    const cleanInner = txt => (txt || '').replace(/[^\d.]/g, '').trim();
    
    const products = await page.evaluate(() => {
      const cleanInner = txt => (txt || '').replace(/[^\d.]/g, '').trim();
      const items = Array.from(document.querySelectorAll('.product-grid-item')).slice(0, 3);
      
      return items.map(card => {
        const nameEl = card.querySelector('h5.product-name a');
        const name = nameEl ? nameEl.textContent.trim() : '';
        
        const imgEl = card.querySelector('.product-image img');
        let image = imgEl ? imgEl.getAttribute('src') || '' : '';
        if (image.startsWith('//')) image = 'https:' + image;
        
        const linkEl = card.querySelector('h5.product-name a');
        let url = linkEl ? linkEl.getAttribute('href') : '';
        if (url && !url.startsWith('http')) url = 'https://www.dndmini.com' + url;
        
        const priceContainer = card.querySelector('.product-prices, .product-price');
        let price = '';
        let priceHTML = '';
        if (priceContainer) {
          priceHTML = priceContainer.innerHTML;
          const newPriceEl = priceContainer.querySelector('.price-new .money, .price-new');
          const oldPriceEl = priceContainer.querySelector('.price-old .money, .price-old');
          const singlePriceEl = priceContainer.querySelector('.money, .price');
          
          if (newPriceEl) price = cleanInner(newPriceEl.textContent);
          else if (oldPriceEl) price = cleanInner(oldPriceEl.textContent);
          else if (singlePriceEl) price = cleanInner(singlePriceEl.textContent);
        }
        
        return { name, image, url, price, priceHTML };
      });
    });
    
    console.log('Found', products.length, 'products\n');
    products.forEach((p, i) => {
      console.log(`=== PRODUCT ${i + 1} ===`);
      console.log('Name:', p.name);
      console.log('Image:', p.image);
      console.log('URL:', p.url);
      console.log('Price:', p.price);
      console.log('Price HTML:', p.priceHTML.substring(0, 200));
      console.log();
    });
    
  } finally {
    await browser.close();
  }
}

testExtract().catch(console.error);
