import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "raffle.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS raffle_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER NOT NULL UNIQUE,
    name TEXT,
    is_reserved INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS raffle_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    status TEXT NOT NULL DEFAULT 'idle',
    winner_number INTEGER,
    winner_name TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS raffle_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_numbers INTEGER NOT NULL,
    winner_number INTEGER NOT NULL,
    winner_name TEXT NOT NULL,
    realizado_em TEXT NOT NULL DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime'))
  )
`);

try {
  db.exec(`ALTER TABLE raffle_config ADD COLUMN raffle_id INTEGER NOT NULL DEFAULT 0`);
} catch {
  //
}

const configExiste = db
  .prepare("SELECT id FROM raffle_config WHERE id = 1")
  .get();

if (!configExiste) {
  db.prepare(
    "INSERT INTO raffle_config (id, status, raffle_id) VALUES (1, 'idle', 0)"
  ).run();
}

export default db;
