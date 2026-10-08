"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addBooking } from "../actions/booking"; // Import from the new actions directory
import "../globalss.css"

interface Car {
  id: number;
  name: string;
  price: number;
  image: string;
  mileage: string;
  seats: string;
  rating: string;
}

function getDiscountInfo(price: number) {
  if (price >= 20000) {
    return { percent: 20, label: "20% OFF" };
  }
  if (price >= 4000) {
    return { percent: 10, label: "10% OFF" };
  }
  if (price >= 2000) {
    return { percent: 5, label: "5% OFF" };
  }
  return { percent: 0, label: "" };
}

export default function Cars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [username, setUsername] = useState("");
  const [isGuest] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("role") === "guest"
  );
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("username") || "");
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/cars")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load cars.");
        return data;
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCars(data);
        } else {
          throw new Error("The car service returned invalid data.");
        }
      })
      .catch((error: Error) => alert(error.message));
  }, []);

  async function handleBook(car: Car) { // Make this function async
    const role = localStorage.getItem("role");

    if (role === "guest") {
      alert("Please login first to book the car");
      router.push("/");
      return;
    }

    const originalPrice = Number(car.price) || 0;
    const discountInfo = getDiscountInfo(originalPrice);
    const discountedPrice = Math.round(originalPrice * (1 - discountInfo.percent / 100));

    const result = await addBooking({
      name: car.name,
      price: discountedPrice,
      mileage: car.mileage,
      seats: car.seats,
      rating: car.rating,
      image: car.image,
    });

    if (!result.success || !result.bookingId) {
      alert("Booking failed: " + result.message);
      return;
    }

    const params = new URLSearchParams({
      bookingId: String(result.bookingId),
      name: car.name,
      price: String(discountedPrice),
      mileage: car.mileage,
      seats: car.seats,
      rating: car.rating,
      image: car.image,
    });
    router.push(`/booking?${params.toString()}`);
  }

  return (
    <div className={`mudiyala ${isGuest ? "guest-mode" : "customer-mode"}`}>
      <div className="top-user-banner">
        <div className="brand-logo-header">
          <Image
            src="/al-logo.png"
            width={44}
            height={36}
            alt="AL Cars Logo"
            className="brand-logo-img"
            unoptimized
          />
          <div className="brand-title-wrap">
            <span className="brand-name">AL Cars</span>
            <span className="brand-tagline">YOUR JOURNEY, YOUR CAR, YOUR WAY.</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>👤 Logged in as: <strong>{username || (isGuest ? "Guest" : "User")}</strong></span>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="logout-mini-btn"
          >
            Logout
          </button>
        </div>
      </div>

      <h1 className="page-heading">{isGuest ? "Guest Page" : "Customer Page"}</h1>

  <div className="sir">
    <div className="car-item">
      <h3>🚗 Toyota - Reliable & Comfortable</h3>
      <Image src="/Toyota.webp" width={300} height={180} alt="Toyota" />
    </div>

    <div className="car-item">
      <h3>🚗 Hyundai - Best Mileage Car</h3>
      <Image src="/hyundai.avif" width={300} height={180} alt="Hyundai" />
    </div>

    <div className="car-item">
      <h3>🚗 Kia - Stylish SUV</h3>
      <Image src="/kia.avif" width={300} height={180} alt="Kia" />
    </div>
  </div>

      <h1 className="cars-section-title">Available Cars</h1>

      <div className=" ajay">
        <div className="cargrid">
          <div></div>

          {cars.map((car, i) => {
            const originalPrice = Number(car.price) || 0;
            const discountInfo = getDiscountInfo(originalPrice);
            const discountedPrice = Math.round(originalPrice * (1 - discountInfo.percent / 100));

            return (
              <div key={i} className="carcard">

                <Image
                  src={car.image?.trim() ? car.image : "/abcdef.jpg"}
                  alt={car.name}
                  width={300}
                  height={180}
                  className="car-image"
                  onError={(e) => {
                    e.currentTarget.src = "/abcdef.jpg";
                  }}
                />

                <h3>{car.name}</h3>

                <div className="price-tag">
                  <span className="old-price">₹{originalPrice}</span>
                  <span className="discount-badge">{discountInfo.label}</span>
                </div>
                <p className="new-price">₹{discountedPrice} / day</p>
                <p>⛽ Mileage: {car.mileage}</p>
                <p>👥 Seats: {car.seats}</p>
                {!isGuest && <p>⭐ Rating: {car.rating}</p>}

                <button onClick={() => handleBook(car)}>
                  Book
                </button>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}