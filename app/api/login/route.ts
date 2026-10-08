import { createSessionToken, sessionCookie } from "@/lib/auth";
import { getDatabaseErrorMessage, getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  role: "user" | "admin";
}

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

    const db = await getDb();
    const [rows] = await db.execute<UserRow[]>(
      "SELECT id, username, password_hash, role FROM users WHERE LOWER(username) = LOWER(?)",
      [body.username.trim()]
    );
    const user = rows[0];
    if (!user || !verifyPassword(body.password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
    response.cookies.set(sessionCookie.name, createSessionToken(user.id, user.role), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionCookie.maxAge,
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      return NextResponse.json(
        { error: "SESSION_SECRET is missing or too short. Set a secret of at least 32 characters in .env.local." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
