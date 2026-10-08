import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Please log in with a user account." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("bookingId" in body) ||
      !Number.isInteger(Number(body.bookingId)) ||
      !("total" in body) ||
      !Number.isFinite(Number(body.total)) ||
      Number(body.total) <= 0 ||
      !("payment" in body) ||
      !["UPI", "Cash", "Card"].includes(String(body.payment)) ||
      !("pickupDate" in body) ||
      typeof body.pickupDate !== "string" ||
      !("returnDate" in body) ||
      typeof body.returnDate !== "string"
    ) {
      return NextResponse.json({ error: "Booking details are invalid." }, { status: 400 });
    }

    const pickupDate = Date.parse(`${body.pickupDate}T00:00:00Z`);
    const returnDate = Date.parse(`${body.returnDate}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(body.pickupDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.returnDate) ||
      !Number.isFinite(pickupDate) ||
      !Number.isFinite(returnDate) ||
      returnDate <= pickupDate
    ) {
      return NextResponse.json(
        { error: "Return date must be after the pickup date." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE bookings
       SET total_amount = ?, payment_method = ?, pickup_date = ?, return_date = ?, status = 'confirmed'
       WHERE id = ? AND user_id = ?`,
      [
        Number(body.total),
        String(body.payment),
        body.pickupDate,
        body.returnDate,
        Number(body.bookingId),
        session.userId,
      ]
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM bookings WHERE id = ? AND user_id = ?",
        [Number(body.bookingId), session.userId]
      );
      if (!rows[0]) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not confirm booking:", error);
    return NextResponse.json({ error: "Could not confirm booking." }, { status: 500 });
  }
}
