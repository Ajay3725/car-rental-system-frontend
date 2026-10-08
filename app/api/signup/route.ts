import { getDatabaseErrorMessage, getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("username" in body) ||
      !("password" in body) ||
      typeof body.username !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const username = body.username.trim();
    if (username.length < 3 || username.length > 50 || body.password.length < 8) {
      return NextResponse.json(
        { error: "Use a username of 3-50 characters and a password of at least 8 characters." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT IGNORE INTO users (username, password_hash, role)
       VALUES (?, ?, 'user')`,
      [username, hashPassword(body.password)]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json(
      { error: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
