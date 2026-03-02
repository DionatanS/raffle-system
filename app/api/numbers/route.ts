import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RaffleNumber } from "@/types/raffle";

export async function GET() {
  const { rows } = await pool.query<RaffleNumber>(
    "SELECT * FROM raffle_numbers ORDER BY number ASC"
  );
  return NextResponse.json(rows);
}
