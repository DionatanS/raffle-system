import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
});

let dbInitialized = false;

export async function initDb() {
  if (dbInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS raffle_numbers (
      id SERIAL PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE,
      name TEXT,
      is_reserved INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS raffle_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status TEXT NOT NULL DEFAULT 'idle',
      winner_number INTEGER,
      winner_name TEXT,
      raffle_id INTEGER NOT NULL DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS raffle_history (
      id SERIAL PRIMARY KEY,
      total_numbers INTEGER NOT NULL,
      winner_number INTEGER NOT NULL,
      winner_name TEXT NOT NULL,
      realizado_em TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
    )
  `);

  const { rows } = await pool.query(
    "SELECT id FROM raffle_config WHERE id = 1"
  );
  if (rows.length === 0) {
    await pool.query(
      "INSERT INTO raffle_config (id, status, raffle_id) VALUES (1, 'idle', 0)"
    );
  }

  dbInitialized = true;
}

export default pool;
