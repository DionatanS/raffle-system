import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RaffleHistoryItem } from "@/types/raffle";

export async function GET() {
  const history = db
    .prepare("SELECT * FROM raffle_history ORDER BY id DESC")
    .all() as RaffleHistoryItem[];

  return NextResponse.json(history);
}
