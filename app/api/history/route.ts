import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RaffleHistoryItem } from "@/types/raffle";

export async function GET() {
  const { rows } = await pool.query<RaffleHistoryItem>(
    "SELECT * FROM raffle_history ORDER BY id DESC"
  );
  return NextResponse.json(rows);
}
