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
  connectionLimit: 20,
  connectTimeout: 15000,
  waitForConnections: true,
  queueLimit: 0
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

async function scrapeStorePage(scraperFunction, storeName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting ${storeName} scrape (page 1 only)...`);
  console.log(`${'='.repeat(60)}`);
  
  let newCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let scrapedCount = 0;
  
  try {
    const startTime = Date.now();
    const prods = await scraperFunction(1);
    const scrapeTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`Scraped ${prods.length} products in ${scrapeTime}s`);
    scrapedCount = prods.length;
    
    if (prods.length === 0) {
      console.warn(`WARNING: ${storeName} returned 0 products`);
      return { storeName, newCount: 0, updateCount: 0, errorCount: 0, scrapedCount: 0 };
    }
    
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
    
    console.log(`${storeName} complete: ${scrapedCount} scraped`);
    console.log(`  Results: ${newCount} new | ${updateCount} updated | ${errorCount} errors`);
    
    return { storeName, newCount, updateCount, errorCount, scrapedCount };
    
  } catch (error) {
    console.error(`ERROR scraping ${storeName}:`, error.message);
    return { storeName, newCount: 0, updateCount: 0, errorCount: 1, scrapedCount: 0 };
  }
}

async function cronScrape() {
  const startTime = Date.now();
  
  console.log('\n');
  console.log(`${'='.repeat(70)}`);
  console.log('KUBERNETES CRON JOB - SCRAPE ALL STORES (PAGE 1 ONLY)');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(70)}`);
  
  if (!await checkDatabaseConnection()) {
    console.error('Cannot proceed without database connection');
    process.exit(1);
  }
  
  const results = [];
  
  // Scrape all stores SEQUENTIALLY (not in parallel)
  console.log('\nScraping stores sequentially...\n');
  
  results.push(await scrapeStorePage(scrapeJS.scrapeJSVari, 'SolarisJapan'));
  results.push(await scrapeStorePage(scrapeTOM.scrapeTOMVari, 'Tokyo Otaku Mode'));
  results.push(await scrapeStorePage(scrapeBBTS.scrapeBBTSVari, 'BigBadToyStore'));
  results.push(await scrapeStorePage(scrapeDnDMini.scrapeDnDMiniVari, 'DnDMini'));
  results.push(await scrapeStorePage(scrapeSuper7.scrapeSuper7Vari, 'Super7'));
  results.push(await scrapeStorePage(scrapeAnimota.scrapeAnimotaVari, 'Animota'));
  
  // Calculate totals
  const totalScraped = results.reduce((sum, r) => sum + r.scrapedCount, 0);
  const totalNew = results.reduce((sum, r) => sum + r.newCount, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.updateCount, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Final summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('CRON SCRAPE COMPLETE - FINAL SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log(`Total execution time: ${totalTime}s`);
  console.log(`\nResults by store:`);
  
  results.forEach(r => {
    console.log(`  ${r.storeName.padEnd(20)} - Scraped: ${r.scrapedCount}, New: ${r.newCount}, Updated: ${r.updateCount}, Errors: ${r.errorCount}`);
  });
  
  console.log(`\nOverall totals:`);
  console.log(`  Total products scraped: ${totalScraped}`);
  console.log(`  New inserts: ${totalNew}`);
  console.log(`  Updates: ${totalUpdated}`);
  console.log(`  Errors: ${totalErrors}`);
  
  const successfulOps = totalNew + totalUpdated;
  const successRate = totalScraped > 0 ? ((successfulOps / totalScraped) * 100).toFixed(2) : 0;
  console.log(`  Success rate: ${successRate}%`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Close the database pool
  await db.end();
  console.log('Database connection closed');
}

// Run the cron scrape job
cronScrape().then(() => {
  console.log('\n✓ Cron scrape job finished successfully');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Cron scrape job failed:', error);
  process.exit(1);
});
