import { NextResponse } from "next/server";
import pool, { initDb } from "@/lib/db";
import { RaffleHistoryItem } from "@/types/raffle";

export async function GET() {
  await initDb();

  const { rows } = await pool.query<RaffleHistoryItem>(
    "SELECT * FROM raffle_history ORDER BY id DESC"
  );

  return NextResponse.json(rows);
}
