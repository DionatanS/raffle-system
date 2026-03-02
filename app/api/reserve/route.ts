import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  const { number, name } = await request.json();

  const result = await pool.query(
    `UPDATE raffle_numbers
     SET is_reserved = 1, name = $1
     WHERE number = $2
     AND is_reserved = 0`,
    [name, number]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { error: "Number already reserved" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
