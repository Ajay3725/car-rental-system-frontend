import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  if (getSessionFromRequest(request)?.role !== "admin") {
    return NextResponse.json({ error: "Admin login required." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("id" in body) ||
      !Number.isInteger(Number(body.id)) ||
      !("name" in body) ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      !("price" in body) ||
      !Number.isFinite(Number(body.price)) ||
      Number(body.price) < 0
    ) {
      return NextResponse.json(
        { error: "A car id, name, and valid price are required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE cars
       SET name = ?, price = ?, image = ?, mileage = ?, seats = ?, rating = ?
       WHERE id = ?`,
      [
        body.name.trim(),
        Number(body.price),
        "image" in body && typeof body.image === "string" ? body.image : "",
        "mileage" in body && typeof body.mileage === "string" ? body.mileage : "",
        "seats" in body && typeof body.seats === "string" ? body.seats : "",
        "rating" in body && typeof body.rating === "string" ? body.rating : "",
        Number(body.id),
      ]
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM cars WHERE id = ?",
        [Number(body.id)]
      );
      if (!rows[0]) return NextResponse.json({ error: "Car not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not update car:", error);
    return NextResponse.json({ error: "Could not update car." }, { status: 500 });
  }
}
