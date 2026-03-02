import { NextResponse } from "next/server";
import pool, { initDb } from "@/lib/db";
import { RaffleStatus } from "@/types/raffle";

export async function GET() {
  await initDb();

  const { rows } = await pool.query<RaffleStatus>(
    "SELECT * FROM raffle_config WHERE id = 1"
  );

  if (rows.length === 0) {
    return NextResponse.json({
      id: 1,
      status: "idle",
      winner_number: null,
      winner_name: null,
      raffle_id: 0,
    });
  }

  return NextResponse.json(rows[0]);
}
