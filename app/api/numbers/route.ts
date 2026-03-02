import { NextResponse } from "next/server";
import pool, { initDb } from "@/lib/db";
import { RaffleNumber } from "@/types/raffle";

export async function GET() {
  await initDb();
  const { rows } = await pool.query<RaffleNumber>(
    "SELECT * FROM raffle_numbers ORDER BY number ASC"
  );
  return NextResponse.json(rows);
}
