require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const scrapeJS = require('../scrappers/sjs.js');
const scrapeTOM = require('../scrappers/stom.js');
const scrapeBBTS = require('../scrappers/bigbadtoystore.js');
const scrapeDnDMini = require('../scrappers/dndmini.js');
const scrapeSuper7 = require('../scrappers/super7.js');
const scrapeAnimota = require('../scrappers/animota.js');
const mysql = require('mysql2/promise');
const query = require('../query.js');

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'aggregatordb',
  connectionLimit: 50,
  connectTimeout: 10000 // 10 seconds to establish connection
});

async function scrapeStore(scraperFunction, scraperName, maxPages) {
  console.log(`Starting ${scraperName} scrape...`);
  let newCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let scrapedCount = 0;
  
  for (let page = 1; page <= maxPages; page++) {
    console.log(`\n=== ${scraperName} Page ${page}/${maxPages} ===`);
    try {
      const prods = await scraperFunction(page);
      console.log(`Scraped ${prods.length} products from page ${page}`);
      scrapedCount += prods.length;
      
      if (prods.length === 0) {
        console.warn(`WARNING: Page ${page} returned 0 products - stopping ${scraperName} scrape`);
        break; // Stop this store's scrape when we hit an empty page
      }
      
      let insertedThisPage = 0;
      for (const [name, image, website, url, price, preowned, rel] of prods) {
        try {
          const result = await query.insertProduct(db, name, image, website, url, price, preowned, rel);
          if (result && result.wasNew) {
            newCount++;
          } else if (result) {
            updateCount++;
          } else {
            console.error(`WARNING: insertProduct returned ${result} for "${name}"`);
            errorCount++;
          }
          insertedThisPage++;
          
          // Log progress every 10 products
          if (insertedThisPage % 10 === 0) {
            console.log(`  Progress: ${insertedThisPage}/${prods.length} products processed`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ FAILED to insert product "${name}": ${error.message}`);
          console.error(`   Full error:`, error);
          // Continue with next product instead of stopping
        }
      }
      console.log(`✓ Page ${page} complete: ${insertedThisPage} processed (${newCount} new, ${updateCount} updated, ${errorCount} errors so far)`);
    } catch (error) {
      console.error(`❌ ERROR scraping ${scraperName} page ${page}:`, error);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${scraperName} FINAL SUMMARY:`);
  console.log(`  Total scraped: ${scrapedCount}`);
  console.log(`  New inserts: ${newCount}`);
  console.log(`  Updates: ${updateCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Success rate: ${((newCount + updateCount) / scrapedCount * 100).toFixed(2)}%`);
  console.log(`${'='.repeat(60)}\n`);
}

async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection OK');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

async function scrape() {
  if (!await checkDatabaseConnection()) {
    console.error('Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Monitor connection pool periodically
  const poolMonitor = setInterval(() => {
    const pool = db.pool;
    console.log(`\nConnection Pool Status:`);
    console.log(`   Total connections: ${pool._allConnections.length}`);
    console.log(`   Free connections: ${pool._freeConnections.length}`);
    console.log(`   Queue length: ${pool._connectionQueue.length}`);
  }, 30000); // Every 30 seconds
  
  const lenS = 250;  // number of pages to scrape for SJS
  const lenT = 250;  // number of pages to scrape for TOM
  const lenB = 250;  // number of pages to scrape for BBTS
  const lenD = 50;   // number of pages to scrape for DnDMini
  const lenSuper = 50; // number of pages to scrape for Super7
  const lenAnimota = 10; // number of pages to scrape for Animota
  
  try {
    // Scrape stores in order
  
    await scrapeStore(scrapeTOM.scrapeTOMVari, 'TOM', lenT);
    await scrapeStore(scrapeBBTS.scrapeBBTSVari, 'BBTS', lenB);
    await scrapeStore(scrapeDnDMini.scrapeDnDMiniVari, 'DnDMini', lenD);
    await scrapeStore(scrapeSuper7.scrapeSuper7Vari, 'Super7', lenSuper);
    await scrapeStore(scrapeJS.scrapeJSVari, 'SJS', lenS);
    await scrapeStore(scrapeAnimota.scrapeAnimotaVari, 'Animota', lenAnimota);
  } finally {
    clearInterval(poolMonitor);
  }
}

scrape().then(() => {
  console.log('Scrape completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Scrape failed:', error);
  process.exit(1);
});