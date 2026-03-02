import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST() {
  await pool.query("DELETE FROM raffle_numbers");
  await pool.query(
    "UPDATE raffle_config SET status = 'idle', winner_number = NULL, winner_name = NULL WHERE id = 1"
  );
  return NextResponse.json({ sucesso: true });
}
