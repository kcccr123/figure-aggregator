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
  connectTimeout: 10000
});

async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection OK\n');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

async function deleteOldestItems(count) {
  if (count <= 0) return 0;
  
  try {
    console.log(`\nDeleting ${count} oldest items...`);
    
    // Get the oldest items from productprices (they have created_at timestamp)
    const [oldestItems] = await db.query(`
      SELECT name 
      FROM productprices 
      ORDER BY created_at ASC 
      LIMIT ?
    `, [count]);
    
    if (oldestItems.length === 0) {
      console.log('No items to delete');
      return 0;
    }
    
    const namesToDelete = oldestItems.map(item => item.name);
    
    // Delete from productprices first (foreign key constraint)
    const [pricesResult] = await db.query(`
      DELETE FROM productprices 
      WHERE name IN (?)
    `, [namesToDelete]);
    
    // Delete from products
    const [productsResult] = await db.query(`
      DELETE FROM products 
      WHERE name IN (?)
    `, [namesToDelete]);
    
    console.log(`Deleted ${pricesResult.affectedRows} items from productprices`);
    console.log(`Deleted ${productsResult.affectedRows} items from products`);
    
    return productsResult.affectedRows;
  } catch (error) {
    console.error('Error deleting old items:', error.message);
    return 0;
  }
}

async function updateDB() {
  if (!await checkDatabaseConnection()) {
    console.error('Cannot proceed without database connection');
    process.exit(1);
  }

  console.log('Starting database update - scraping page 1 from all stores...\n');
  console.log(`${'='.repeat(60)}`);
  
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  const stores = [
    { name: 'SolarisJapan', scraper: scrapeJS.scrapeJSVari },
    { name: 'Tokyo Otaku Mode', scraper: scrapeTOM.scrapeTOMVari },
    { name: 'BigBadToyStore', scraper: scrapeBBTS.scrapeBBTSVari },
    { name: 'DnDMini', scraper: scrapeDnDMini.scrapeDnDMiniVari },
    { name: 'Super7', scraper: scrapeSuper7.scrapeSuper7Vari },
    { name: 'Animota', scraper: scrapeAnimota.scrapeAnimotaVari }
  ];
  
  for (const store of stores) {
    console.log(`\nScraping ${store.name}...`);
    
    try {
      const startTime = Date.now();
      const prods = await store.scraper(1);
      const scrapeTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`Found ${prods.length} products in ${scrapeTime}s`);
      
      let newCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < prods.length; i++) {
        const [name, image, website, url, price, preowned, rel] = prods[i];
        
        try {
          const result = await query.insertProduct(db, name, image, website, url, price, preowned, rel);
          
          if (result && result.wasNew) {
            newCount++;
          } else if (result) {
            updateCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Failed to insert product from ${store.name}:`, error.message);
        }
      }
      
      totalInserted += newCount;
      totalUpdated += updateCount;
      totalErrors += errorCount;
      
      console.log(`${store.name}: ${newCount} new, ${updateCount} updated, ${errorCount} errors`);
      
    } catch (error) {
      console.error(`Error scraping ${store.name}:`, error.message);
      totalErrors++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('SCRAPING COMPLETE - SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total new items inserted: ${totalInserted}`);
  console.log(`Total items updated: ${totalUpdated}`);
  console.log(`Total errors: ${totalErrors}`);
  
  // Delete oldest items equal to the number of new items inserted
  const deletedCount = await deleteOldestItems(totalInserted);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('DATABASE UPDATE COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`Net change: +${totalInserted} new, -${deletedCount} old`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Close the database pool
  await db.end();
}

updateDB().then(() => {
  console.log('Database update job finished successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Database update job failed:', error);
  process.exit(1);
});
