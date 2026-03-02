import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RaffleStatus } from "@/types/raffle";

export async function GET() {
  const config = db
    .prepare("SELECT * FROM raffle_config WHERE id = 1")
    .get() as RaffleStatus | undefined;

  if (!config) {
    return NextResponse.json({
      id: 1,
      status: "idle",
      winner_number: null,
      winner_name: null,
    });
  }

  return NextResponse.json(config);
}
