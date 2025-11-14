const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load config
const configPath = path.join(__dirname, '..', 'config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

module.exports.insertProduct = async (db, name, image, website, url, price, preowned, rel) => {
  // Convert empty strings to null for DECIMAL columns
  const cleanPrice = price === '' ? null : price;
  const cleanPreowned = preowned === '' ? null : preowned;
  const cleanRel = rel === '' ? null : rel;
  
  let connection;
  const startTime = Date.now();
  
  try {
    // Add timeout to connection acquisition
    connection = await withTimeout(db.getConnection(), 10000);
    const connTime = Date.now() - startTime;
    if (connTime > 2000) {
      console.warn(`⚠️  Slow connection acquisition: ${connTime}ms for "${name}"`);
    }
    
    await withTimeout(connection.beginTransaction(), 5000);
    
    const [result1] = await withTimeout(connection.query(
      `INSERT INTO products (name,image,website,url)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE image=VALUES(image),website=VALUES(website),url=VALUES(url)`,
      [name, image, website, url]
    ), 10000);
    
    const [result2] = await withTimeout(connection.query(
      `INSERT INTO productprices (name,price,preowned,rel)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE price=VALUES(price),preowned=VALUES(preowned),rel=VALUES(rel)`,
      [name, cleanPrice, cleanPreowned, cleanRel]
    ), 10000);
    
    await withTimeout(connection.commit(), 5000);
    
    const totalTime = Date.now() - startTime;
    if (totalTime > 5000) {
      console.warn(`⚠️  Slow insert: ${totalTime}ms for "${name}"`);
    }
    
    // Return true if this was a new insert (affectedRows = 1 for insert, 2 for update)
    // If either table had a new insert, consider it a new product
    const wasNew = result1.affectedRows === 1 || result2.affectedRows === 1;
    return { wasNew, affectedRows1: result1.affectedRows, affectedRows2: result2.affectedRows };
  } catch (error) {
    if (connection) {
      try {
        await withTimeout(connection.rollback(), 5000);
      } catch (rollbackError) {
        console.error('❌ Error rolling back transaction:', rollbackError.message);
      }
    }
    console.error(`❌ Error inserting product "${name}":`, error.message);
    console.error(`   Error type: ${error.code}, SQL State: ${error.sqlState}`);
    throw error; // Re-throw so caller knows it failed
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports.getSearchResults = async (db, term, filters, sort$, ordert, onlyPre, onlyUsed) => {
  let sql = `
    SELECT
      p.name,
      p.image,
      p.website,
      p.url,
      pp.price,
      pp.preowned,
      pp.rel
    FROM products p
    JOIN productprices pp ON p.name = pp.name
  `;
  const where = [];

  if (term) where.push(`p.name LIKE ${db.escape('%' + term + '%')}`);

  // store filters
  const map = config.stores;
  const sites = [...filters]
    .map((b, i) => b === '1' ? map[i] : null)
    .filter(Boolean);
  if (sites.length) {
    where.push(`p.website IN (${sites.map(s => db.escape(s)).join(',')})`);
  }

  // order-type flags
  if (ordert) {
    const ops = [
      'pp.rel IS NOT NULL',
      'pp.rel IS NULL',
      'pp.price IS NOT NULL'
    ];
    const picks = [...ordert]
      .map((b, i) => b === '1' ? ops[i] : null)
      .filter(Boolean);
    if (picks.length) where.push(picks.join(' AND '));
  }

  if (onlyPre) where.push("(pp.rel IS NOT NULL AND pp.rel <> '')");
  if (onlyUsed) where.push("(pp.preowned IS NOT NULL AND pp.preowned <> '')");

  // Filter out sold out when sorting by price
  if (sort$ === 'high' || sort$ === 'low') {
    where.push("(pp.price IS NOT NULL AND pp.price != '' OR pp.preowned IS NOT NULL AND pp.preowned != '')");
  }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  if (sort$ === 'high') sql += ' ORDER BY COALESCE(pp.price, pp.preowned) DESC';
  else if (sort$ === 'low') sql += ' ORDER BY COALESCE(pp.price, pp.preowned) ASC';

  const [rows] = await db.query(sql);
  return rows;
};

module.exports.getNumInStore = async (db, name, term) => {
  let sql = 'SELECT COUNT(*) AS count FROM products p';
  const where = [];
  if (name) where.push(`p.website LIKE ${db.escape('%' + name + '%')}`);
  if (term) where.push(`p.name LIKE ${db.escape('%' + term + '%')}`);
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  const [rows] = await db.query(sql);
  return rows;
};

module.exports.getFeaturedItems = async (db) => {
  const sql = `
    SELECT name, image, website, url, timestamp_utc, price
    FROM (
      SELECT p.*, pp.price, ROW_NUMBER() OVER (PARTITION BY p.website ORDER BY p.timestamp_utc DESC) AS rn
      FROM products p
      JOIN productprices pp ON p.name = pp.name
      WHERE pp.price IS NOT NULL AND pp.price != ''
    ) t
    WHERE rn <= 10
    ORDER BY website, timestamp_utc DESC
  `;
  const [rows] = await db.query(sql);
  return rows;
};


module.exports.getDBDisk = async (db) => {
  let sql = 
  `SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'aggregatordb'
GROUP BY table_schema;`;
  const [row] = await db.query(sql);
  return row;
};