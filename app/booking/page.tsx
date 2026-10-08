"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import "../globalss.css"

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function BookingContent() {
  const params = useSearchParams();
  const router = useRouter();

  const name = params.get("name") || "Car";
  const pricePerDay = Number(params.get("price")) || 0;
  const bookingId = params.get("bookingId") || "";
  const carImage = params.get("image") || "/Toyota.webp";

  const todayString = getTodayString();
  const [startDate, setStartDate] = useState(todayString);
  const [endDate, setEndDate] = useState("");
  const [totalPrice, setTotalPrice] = useState(pricePerDay);
  const [error, setError] = useState("");

  function calculatePrice(selectedStart = startDate, selectedEnd = endDate) {
    setError("");
    if (!selectedStart) {
      setError("Please select a pickup date.");
      setTotalPrice(0);
      return false;
    }
    if (selectedStart < todayString) {
      setError("Pickup date cannot be in the past. Please select today or a future date.");
      setTotalPrice(0);
      return false;
    }
    if (!selectedEnd) {
      setError("Please select a return date.");
      setTotalPrice(0);
      return false;
    }
    if (selectedEnd < selectedStart) {
      setError("Return date cannot be earlier than pickup date.");
      setTotalPrice(0);
      return false;
    }

    const start = new Date(selectedStart + "T00:00:00");
    const end = new Date(selectedEnd + "T00:00:00");

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const rentalDays = diffDays === 0 ? 1 : diffDays; // Same day rental counts as 1 day

    if (rentalDays > 0) {
      const calculated = rentalDays * pricePerDay;
      setTotalPrice(calculated);
      return true;
    } else {
      setError("Invalid rental duration.");
      setTotalPrice(0);
      return false;
    }
  }

  function handleStartDateChange(dateVal: string) {
    setStartDate(dateVal);
    setError("");
    if (dateVal < todayString) {
      setError("Previous/past dates cannot be booked. Please choose today or a future date.");
      return;
    }
    if (endDate && dateVal > endDate) {
      setEndDate(dateVal);
      calculatePrice(dateVal, dateVal);
    } else if (endDate) {
      calculatePrice(dateVal, endDate);
    }
  }

  function handleEndDateChange(dateVal: string) {
    setEndDate(dateVal);
    setError("");
    if (startDate && dateVal < startDate) {
      setError("Return date cannot be before pickup date.");
      return;
    }
    if (startDate) {
      calculatePrice(startDate, dateVal);
    }
  }

  function goToPayment() {
    if (!startDate || !endDate) {
      setError("Please select both Pickup Date and Return Date.");
      return;
    }
    if (startDate < todayString) {
      setError("Previous/past dates cannot be booked. Pickup date must be today or later.");
      return;
    }
    if (endDate < startDate) {
      setError("Return date cannot be earlier than pickup date.");
      return;
    }

    const isValid = calculatePrice(startDate, endDate);
    if (!isValid || totalPrice <= 0 || !bookingId) {
      return;
    }

    const paymentParams = new URLSearchParams({
      bookingId,
      name,
      total: String(totalPrice),
      pickupDate: startDate,
      returnDate: endDate,
    });
    router.push(`/payment?${paymentParams.toString()}`);
  }

  return (
    <div className="booking-page">
      <div className="booking-card">
        <div className="booking-header">
          <div className="brand-logo-header" style={{ justifyContent: "center", marginBottom: "12px" }}>
            <Image
              src="/al-logo.png"
              width={46}
              height={38}
              alt="AL Cars Logo"
              className="brand-logo-img"
              unoptimized
            />
            <div className="brand-title-wrap" style={{ textAlign: "left" }}>
              <span className="brand-name">AL Cars</span>
              <span className="brand-tagline">YOUR JOURNEY, YOUR CAR, YOUR WAY.</span>
            </div>
          </div>
          <span className="booking-badge">Book Your Ride</span>
          <h1>Plan your trip</h1>
        </div>

        <Image
          className="booking-hero-image"
          src={carImage}
          width={800}
          height={450}
          alt={name}
          unoptimized
        />

        <div className="booking-car-box">
          <div>
            <p className="booking-label">Selected Car</p>
            <h2>{name}</h2>
          </div>
          <div className="booking-price-box">
            <p>₹{pricePerDay}</p>
            <span>per day</span>
          </div>
        </div>

        <div className="booking-summary">
          <div>
            <span>Price per day</span>
            <strong>₹{pricePerDay}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>₹{totalPrice || 0}</strong>
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1.5px solid #ef4444",
            color: "#dc2626",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "0.88rem",
            fontWeight: "700",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="booking-date-row">
          <label>
            <span>Pickup Date</span>
            <input
              type="date"
              min={todayString}
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </label>

          <label>
            <span>Return Date</span>
            <input
              type="date"
              min={startDate || todayString}
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </label>
        </div>

        <div className="booking-actions">
          <button className="secondary-btn" onClick={() => calculatePrice(startDate, endDate)}>
            Calculate Total
          </button>
          <button className="primary-btn" onClick={goToPayment}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingContent />
    </Suspense>
  );
}