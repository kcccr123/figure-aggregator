require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const query = require('./query.js');

const app = express();
const allowedOrigins = [
  'https://figure-center.netlify.app',  
  'http://localhost:3000'               
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: access denied from ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'aggregatordb',
  connectionLimit: 10
});

// health check for GCP load balancer
app.get('/', (_, res) => res.status(200).send('ok'));

// Create a router for all "/figures" endpoints
const figuresRouter = express.Router();

/**
 * GET /figures/search
 * Query products with optional search term, filters, sort, and order.
 */
figuresRouter.get('/search', async (req, res) => {
  console.log('/search req.query:', req.query);
  const term = (req.query.query || '').trim();
  const filters = req.query.filters || '';
  const sort$ = req.query.sort$;
  const ordert = req.query.ordertype;
  const onlyPre = req.query.preorder === 'true';
  const onlyUsed = req.query.preowned === 'true';

  try {
    const rows = await query.getSearchResults(db, term, filters, sort$, ordert, onlyPre, onlyUsed);
    res.send(rows);
  } catch (err) {
    console.error('/search error →', err);
    res.status(500).send({ error: err.sqlMessage || 'DB error' });
  }
});

/**
 * GET /figures/numInStore
 */
figuresRouter.get('/numInStore', async (req, res) => {
  const name = req.query.name?.trim() || '';
  const term = req.query.searchParem?.trim() || '';
  try {
    const rows = await query.getNumInStore(db, name, term);
    res.send(rows);
  } catch (e) {
    res.status(500).send({ error: 'DB error' });
  }
});

/**
 * GET /figures/featuredItems
 */
figuresRouter.get('/featuredItems', async (req, res) => {
  try {
    const rows = await query.getFeaturedItems(db);
    res.send(rows);
  } catch (e) {
    res.status(500).send({ error: 'DB error' });
  }
});

// Mount the figures router under /figures
app.use('/figures', figuresRouter);

app.listen(4000, async () => {
  console.log('Server is running on port 4000');                 
});
