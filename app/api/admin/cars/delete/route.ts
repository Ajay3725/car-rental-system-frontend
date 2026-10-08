import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  if (getSessionFromRequest(request)?.role !== "admin") {
    return NextResponse.json({ error: "Admin login required." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("id" in body) || !Number.isInteger(Number(body.id))) {
      return NextResponse.json({ error: "A valid car id is required." }, { status: 400 });
    }
    const db = await getDb();
    const [result] = await db.execute<ResultSetHeader>("DELETE FROM cars WHERE id = ?", [
      Number(body.id),
    ]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Car not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not delete car:", error);
    return NextResponse.json({ error: "Could not delete car." }, { status: 500 });
  }
}
