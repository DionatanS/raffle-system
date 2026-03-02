import { NextResponse } from "next/server";
import pool, { initDb } from "@/lib/db";
import { RaffleNumber } from "@/types/raffle";

export async function POST() {
  await initDb();

  const { rows: reserved } = await pool.query<RaffleNumber>(
    "SELECT * FROM raffle_numbers WHERE is_reserved = 1"
  );

  if (reserved.length === 0) {
    return NextResponse.json({ error: "No reserved numbers" }, { status: 400 });
  }

  const winner = reserved[Math.floor(Math.random() * reserved.length)];

  const { rows: countRows } = await pool.query<{ total: string }>(
    "SELECT COUNT(*) as total FROM raffle_numbers"
  );
  const totalNumbers = parseInt(countRows[0].total, 10);

  await pool.query(
    "UPDATE raffle_config SET status = 'finished', winner_number = $1, winner_name = $2 WHERE id = 1",
    [winner.number, winner.name]
  );

  await pool.query(
    `INSERT INTO raffle_history (total_numbers, winner_number, winner_name, realizado_em)
     VALUES ($1, $2, $3, to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'))`,
    [totalNumbers, winner.number, winner.name]
  );

  return NextResponse.json(winner);
}
