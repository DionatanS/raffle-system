import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RaffleStatus } from "@/types/raffle";

export async function GET() {
  const debug = {
    DATABASE_URL: process.env.DATABASE_URL ? "definida" : "UNDEFINED",
    RH_USER: process.env.RH_USER ? "definida" : "UNDEFINED",
    RH_PASS: process.env.RH_PASS ? "definida" : "UNDEFINED",
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL não configurada", debug },
      { status: 500 }
    );
  }

  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
