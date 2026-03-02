import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RaffleNumber } from "@/types/raffle";

export async function GET() {
  const numbers = db
    .prepare("SELECT * FROM raffle_numbers ORDER BY number ASC")
    .all() as RaffleNumber[];

  return NextResponse.json(numbers);
}
