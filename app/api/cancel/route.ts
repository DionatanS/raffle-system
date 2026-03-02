import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST() {
  db.prepare("DELETE FROM raffle_numbers").run();
  db.prepare(
    "UPDATE raffle_config SET status = 'idle', winner_number = NULL, winner_name = NULL WHERE id = 1"
  ).run();

  return NextResponse.json({ sucesso: true });
}
