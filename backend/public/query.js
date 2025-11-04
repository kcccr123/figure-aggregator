const mysql = require('mysql2/promise');

module.exports.insertProduct = async (db, name, image, website, url, price, preowned, rel) => {
  try {
    await db.query(
      `INSERT INTO products (name,image,website,url)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE image=VALUES(image),website=VALUES(website),url=VALUES(url)`,
      [name, image, website, url]
    );
  } catch (error) {
    console.error('Error inserting into products:', error);
  }
  try {
    await db.query(
      `INSERT INTO productprices (name,price,preowned,rel)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE price=VALUES(price),preowned=VALUES(preowned),rel=VALUES(rel)`,
      [name, price, preowned, rel]
    );
  } catch (error) {
    console.error('Error inserting into productprices:', error);
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
  const map = ['SolarisJapan', 'TokyoOtakuMode'];
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

  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  if (sort$ === 'high') sql += ' ORDER BY pp.price DESC';
  else if (sort$ === 'low') sql += ' ORDER BY pp.price ASC';

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

module.exports.getFeaturedItems = async (db, store) => {
  const sql = `
    SELECT name, image, website, url, inserted_timestamp_utc
    FROM products
    WHERE website = ?
    ORDER BY inserted_timestamp_utc DESC
    LIMIT 10
  `;
  const [rows] = await db.query(sql, [store]);
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