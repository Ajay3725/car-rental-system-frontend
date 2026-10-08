import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, price, image, mileage, seats, rating
       FROM cars ORDER BY id`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Could not load cars:", error);
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "MySQL is not configured. Create .env.local from .env.example and set DATABASE_URL." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Cannot connect to MySQL. Check that MySQL is running and DATABASE_URL is correct." },
      { status: 503 }
    );
  }
}
