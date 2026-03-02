import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { total } = await request.json();

  db.prepare("DELETE FROM raffle_numbers").run();

  const insert = db.prepare("INSERT INTO raffle_numbers (number) VALUES (?)");
  const insertMany = db.transaction((count: number) => {
    for (let i = 1; i <= count; i++) {
      insert.run(i);
    }
  });

  insertMany(total);

  db.prepare(
    `UPDATE raffle_config
     SET status = 'active',
         winner_number = NULL,
         winner_name = NULL,
         raffle_id = raffle_id + 1
     WHERE id = 1`
  ).run();

  return NextResponse.json({ success: true });
}
