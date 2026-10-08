"use server";

import { getCurrentSession } from "@/lib/auth";
import { getDb, type BookingInput } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

export async function addBooking(carDetails: BookingInput) {
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    return { success: false, message: "Please log in with a user account to book a car." };
  }

  try {
    const db = await getDb();
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO bookings (user_id, car_details, status)
       VALUES (?, ?, 'pending')`,
      [session.userId, JSON.stringify(carDetails)]
    );
    return {
      success: true,
      message: "Booking stored successfully",
      bookingId: result.insertId,
    };
  } catch (error) {
    console.error("Could not create booking:", error);
    return { success: false, message: "Booking could not be saved. Please try again." };
  }
}
