const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Koneksi MySQL (ganti dengan data kamu)
const dbConfig = {
  host: 'sql12.freesqldatabase.com',
  user: 'sql12769841', // ganti ini
  password: 't6xp2cyxnd', // ganti ini
  database: 'sql12769841' // ganti ini
};

// Buat tabel otomatis
async function initDB() {
  const conn = await mysql.createConnection(dbConfig);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id VARCHAR(36) PRIMARY KEY,
      url TEXT NOT NULL
    )
  `);
  conn.end();
}
initDB();

// API untuk proxy
app.post('/api/:id', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT url FROM webhooks WHERE id = ?', 
      [req.params.id]
    );
    conn.end();

    if (rows.length === 0) return res.status(404).send('Link tidak valid!');

    const response = await fetch(rows[0].url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    res.status(response.status).send(await response.text());
  } catch (error) {
    res.status(500).send('Error!');
  }
});

// Admin: Tambah webhook
app.post('/admin/webhooks', async (req, res) => {
  const id = uuidv4();
  const conn = await mysql.createConnection(dbConfig);
  await conn.execute(
    'INSERT INTO webhooks (id, url) VALUES (?, ?)',
    [id, req.body.url]
  );
  conn.end();
  res.json({ link: `https://webhook-kamu.vercel.app/api/${id}` });
});

// Admin: List webhooks
app.get('/admin/webhooks', async (req, res) => {
  const conn = await mysql.createConnection(dbConfig);
  const [rows] = await conn.execute('SELECT * FROM webhooks');
  conn.end();
  res.json(rows);
});

app.listen(3000, () => console.log('Server jalan di port 3000!'));