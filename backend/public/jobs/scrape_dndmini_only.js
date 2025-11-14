require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const scrapingDnDMini = require('../scrappers/dndmini.js');
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

async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    console.log('✓ Database connection OK\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function scrapeDnDMini() {
  if (!await checkDatabaseConnection()) {
    console.error('Cannot proceed without database connection');
    process.exit(1);
  }

  const maxPages = 50; // Number of pages to scrape for DnDMini
  let newCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let scrapedCount = 0;

  console.log('Starting DnD Mini scrape...');
  console.log(`Will scrape ${maxPages} pages\n`);

  for (let page = 1; page <= maxPages; page++) {
    console.log(`${'='.repeat(60)}`);
    console.log(`📖 Page ${page}/${maxPages}`);
    console.log(`${'='.repeat(60)}`);

    try {
      const startTime = Date.now();
      const prods = await scrapingDnDMini.scrapeDnDMiniVari(page);
      const scrapeTime = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`Scraped ${prods.length} products in ${scrapeTime}s`);
      scrapedCount += prods.length;

      if (prods.length === 0) {
        console.warn(`WARNING: Page ${page} returned 0 products - likely end of catalog`);
        console.log(`\nStopping scrape at page ${page}\n`);
        break;
      }

      let insertedThisPage = 0;
      for (let i = 0; i < prods.length; i++) {
        const [name, image, website, url, price, preowned, rel] = prods[i];

        try {
          const result = await query.insertProduct(db, name, image, website, url, price, preowned, rel);
          
          if (result && result.wasNew) {
            newCount++;
          } else if (result) {
            updateCount++;
          } else {
            console.error(`insertProduct returned null for "${name}"`);
            errorCount++;
          }
          insertedThisPage++;

          // Log progress every 10 products
          if ((i + 1) % 10 === 0) {
            console.log(`  Progress: ${i + 1}/${prods.length} products processed`);
          }
        } catch (error) {
          errorCount++;
          console.error(`FAILED to insert: "${name}"`);
          console.error(`   Error: ${error.message}`);
        }
      }

      console.log(`Page ${page} complete: ${insertedThisPage} processed`);
      console.log(`  Running totals: ${newCount} new | ${updateCount} updated | ${errorCount} errors\n`);

    } catch (error) {
      console.error(`ERROR scraping page ${page}:`, error.message);
      console.error('Continuing to next page...\n');
    }
  }

  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SCRAPE COMPLETE - FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total products scraped: ${scrapedCount}`);
  console.log(`New inserts: ${newCount}`);
  console.log(`Updates: ${updateCount}`);
  console.log(`Errors: ${errorCount}`);
  
  const successfulOps = newCount + updateCount;
  const successRate = scrapedCount > 0 ? ((successfulOps / scrapedCount) * 100).toFixed(2) : 0;
  console.log(`Success rate: ${successRate}%`);
  console.log(`${'='.repeat(60)}\n`);

  // Close the database pool
  await db.end();
}

scrapeDnDMini().then(() => {
  console.log('Scrape job finished successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Scrape job failed:', error);
  process.exit(1);
});
