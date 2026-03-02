import { NextRequest, NextResponse } from "next/server";
import pool, { initDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  await initDb();
  const { total } = await request.json();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM raffle_numbers");

    for (let i = 1; i <= total; i++) {
      await client.query("INSERT INTO raffle_numbers (number) VALUES ($1)", [i]);
    }

    await client.query(
      `UPDATE raffle_config
       SET status = 'active',
           winner_number = NULL,
           winner_name = NULL,
           raffle_id = raffle_id + 1
       WHERE id = 1`
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true });
}
