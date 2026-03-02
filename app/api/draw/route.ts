import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RaffleNumber } from "@/types/raffle";

export async function POST() {
  const reserved = db
    .prepare("SELECT * FROM raffle_numbers WHERE is_reserved = 1")
    .all() as RaffleNumber[];

  if (reserved.length === 0) {
    return NextResponse.json({ error: "No reserved numbers" }, { status: 400 });
  }

  const winner = reserved[Math.floor(Math.random() * reserved.length)];

  const totalNumbers = (
    db.prepare("SELECT COUNT(*) as total FROM raffle_numbers").get() as {
      total: number;
    }
  ).total;

  db.prepare(
    "UPDATE raffle_config SET status = 'finished', winner_number = ?, winner_name = ? WHERE id = 1"
  ).run(winner.number, winner.name);

  db.prepare(
    "INSERT INTO raffle_history (total_numbers, winner_number, winner_name) VALUES (?, ?, ?)"
  ).run(totalNumbers, winner.number, winner.name);

  return NextResponse.json(winner);
}
