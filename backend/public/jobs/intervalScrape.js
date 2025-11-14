require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const scrapeSJSFeatured = require('../scrappers/sjsFeatured.js');
const scrapeSTOMFeatured = require('../scrappers/stomFeatured.js');
const scrapeBBTS = require('../scrappers/bigbadtoystore.js');
const mysql = require('mysql2/promise');
const query = require('../query.js');

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'aggregatordb',
  connectionLimit: 10
});

async function intervalScrape() {
  const bbtsProds = await scrapeBBTS.scrapeBBTSVari(1);
  const bbtsItems = bbtsProds.map(([name, image, website, url, price, preowned, rel]) => [name, image, website, url, price, rel]);
  const items = [
    ...(await scrapeSJSFeatured.scrapeSJSFeatured()),
    ...(await scrapeSTOMFeatured.scrapeSTOMFeatured()),
    ...bbtsItems
  ];
  for (const [name, images, website, url, preorder, release] of items) {
    const primaryImage = Array.isArray(images) ? images[0] : images.split('>>><<<')[0];
    await query.insertProduct(db, name, primaryImage, website, url, null, null, release || preorder);
  }
}

intervalScrape().then(() => process.exit(0)).catch(() => process.exit(1));