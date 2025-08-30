const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// --- Database Configuration ---
// Use environment variables for production
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dpdp_compliance',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory


app.get('/', (req, res) => {
  res.send('DPDP Compliance Backend is running!');
});

// --- Database Test Endpoint ---
app.get('/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json({ message: 'Database connection successful!', time: result.rows[0] });
    client.release();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// --- Consent Management API (for Dashboard) ---

// GET all consent configurations
app.get('/api/consents', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM consent_configurations ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST a new consent configuration
app.post('/api/consents', async (req, res) => {
  const { name, content, button_text, background_color, text_color } = req.body;

  // Basic validation
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content fields are required' });
  }

  try {
    const newConsent = await pool.query(
      'INSERT INTO consent_configurations (name, content, button_text, background_color, text_color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, content, button_text, background_color, text_color]
    );
    res.status(201).json(newConsent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- Public API (for embeddable script) ---

// GET a specific banner configuration
app.get('/api/public/banner/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT name, content, button_text, background_color, text_color FROM consent_configurations WHERE id = $1', [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Banner configuration not found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// POST to log a consent action
app.post('/api/public/consent', async (req, res) => {
    const { configurationId, userIdentifier, metadata } = req.body;
    if (!configurationId) {
        return res.status(400).json({ error: 'configurationId is required' });
    }

    try {
        await pool.query(
            'INSERT INTO consent_log (configuration_id, user_identifier, metadata) VALUES ($1, $2, $3)',
            [configurationId, userIdentifier, metadata]
        );
        res.status(201).send({ message: 'Consent logged' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
