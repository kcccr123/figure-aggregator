require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const scrapeSJSFeatured = require('../scrappers/sjsFeatured.js');
const scrapeSTOMFeatured = require('../scrappers/stomFeatured.js');
const scrapeBBTS = require('../scrappers/bigbadtoystore.js');
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'aggregatordb',
  connectionLimit: 10
});

async function scrapeFeatured() {
  await db.query('DELETE FROM featured');
  const bbtsProds = await scrapeBBTS.scrapeBBTSVari(1);
  const bbtsItems = bbtsProds.map(([name, image, website, url, price, preowned, rel]) => [name, image, website, url, null, rel]);
  const items = [
    ...(await scrapeSJSFeatured.scrapeSJSFeatured()),
    ...(await scrapeSTOMFeatured.scrapeSTOMFeatured()),
    ...bbtsItems
  ];
  for (const [name, images, website, url, preorder, release] of items) {
    const primaryImage = Array.isArray(images) ? images[0] : images.split('>>><<<')[0];
    try {
      await db.query(
        `INSERT INTO products (name,image,website,url)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE image=VALUES(image),website=VALUES(website),url=VALUES(url)`,
        [name, primaryImage, website, url]
      );
    } catch (error) {
      console.error('Error inserting into products:', error);
    }
    try {
      await db.query(
        `INSERT INTO featured (name,images,website,url,preorder,rel)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE images=VALUES(images),preorder=VALUES(preorder),rel=VALUES(rel)`,
        [name, images, website, url, preorder, release]
      );
    } catch (error) {
      console.error('Error inserting into featured:', error);
    }
  }
}

scrapeFeatured().then(() => process.exit(0)).catch(() => process.exit(1));