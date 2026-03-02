import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { number, name } = await request.json();

  const result = db
    .prepare(
      `UPDATE raffle_numbers
       SET is_reserved = 1, name = ?
       WHERE number = ?
       AND is_reserved = 0`
    )
    .run(name, number);

  if (result.changes === 0) {
    return NextResponse.json(
      { error: "Number already reserved" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
