import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (getSessionFromRequest(request)?.role !== "admin") {
    return NextResponse.json({ error: "Admin login required." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("name" in body) ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      !("price" in body) ||
      !Number.isFinite(Number(body.price)) ||
      Number(body.price) < 0
    ) {
      return NextResponse.json(
        { error: "A car name and valid price are required." },
        { status: 400 }
      );
    }

    const values = [
      body.name.trim(),
      Number(body.price),
      "image" in body && typeof body.image === "string" ? body.image : "/placeholder.jpg",
      "mileage" in body && typeof body.mileage === "string" ? body.mileage : "",
      "seats" in body && typeof body.seats === "string" ? body.seats : "",
      "rating" in body && typeof body.rating === "string" ? body.rating : "",
    ];
    const db = await getDb();
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO cars (name, price, image, mileage, seats, rating)
       VALUES (?, ?, ?, ?, ?, ?)`,
      values
    );
    return NextResponse.json(
      {
        success: true,
        car: {
          id: result.insertId,
          name: values[0],
          price: values[1],
          image: values[2],
          mileage: values[3],
          seats: values[4],
          rating: values[5],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Could not add car:", error);
    return NextResponse.json({ error: "Could not add car." }, { status: 500 });
  }
}
