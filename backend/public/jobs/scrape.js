require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const scrapeJS = require('../scrappers/sjs.js');
const scrapeTOM = require('../scrappers/stom.js');
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

async function scrape() {
  const lenS = 300;  // number of pages to scrape for SJS
  const lenT = 300;  // number of pages to scrape for TOM
  const lenB = 300;  // number of pages to scrape for BBTS
  console.log('Starting BBTS scrape...');
  for (let pageB = 1; pageB <= lenB; pageB++) {
    console.log(`Starting BBTS page ${pageB}...`);
    try {
      const prods = await scrapeBBTS.scrapeBBTSVari(pageB);
      for (const [name, image, website, url, price, preowned, rel] of prods) {
        try {
          await query.insertProduct(db, name, image, website, url, price, preowned, rel);
        } catch (error) {
          console.error(`Error inserting BBTS product ${name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error scraping BBTS page ${pageB}:`, error);
    }
    console.log(`Finished BBTS page ${pageB}`);
  }
  console.log('Starting SJS scrape...');
  for (let pageS = 1; pageS <= lenS; pageS++) {
    try {
      const prods = await scrapeJS.scrapeJSVari(pageS);
      for (const [name, image, website, url, price, preowned, rel] of prods) {
        try {
          await query.insertProduct(db, name, image, website, url, price, preowned, rel);
        } catch (error) {
          console.error(`Error inserting SJS product ${name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error scraping SJS page ${pageS}:`, error);
    }
  }
  console.log('Starting TOM scrape...');
  for (let pageT = 1; pageT <= lenT; pageT++) {
    try {
      const prods = await scrapeTOM.scrapeTOMVari(pageT);
      for (const [name, image, website, url, price, preowned, rel] of prods) {  
        try {
          await query.insertProduct(db, name, image, website, url, price, preowned, rel);
        } catch (error) {
          console.error(`Error inserting TOM product ${name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error scraping TOM page ${pageT}:`, error);
    }
  }
}

scrape().then(() => {
  console.log('Scrape completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Scrape failed:', error);
  process.exit(1);
});