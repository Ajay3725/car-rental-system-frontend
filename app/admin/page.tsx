"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../globalss.css";

interface Car {
  id: number;
  name: string;
  price: number | string;
  image: string;
  mileage: string;
  seats: string;
  rating: string;
}

export default function Admin() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [mileage, setMileage] = useState("");
  const [seats, setSeats] = useState("");
  const [rating, setRating] = useState("");
  const [adminName, setAdminName] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [cars, setCars] = useState<Car[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const router = useRouter();

  const fetchCars = () => {
    fetch("/api/admin/cars")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load cars.");
        return res.json();
      })
      .then((data) => {
        setCars(data || []);
      })
      .catch((error: Error) => alert(error.message));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAdminName(localStorage.getItem("username") || "admin");
      const savedTheme = localStorage.getItem("admin_theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
    fetchCars();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_theme", nextTheme);
    }
  };

  async function addCar() {
    if (!name || !price) return alert("Please enter at least a name and price.");
    try {
      const response = await fetch("/api/admin/cars/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, image, mileage, seats, rating })
      });
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Could not add car.");

      alert("Car added successfully!");
      setName("");
      setPrice("");
      setImage("");
      setMileage("");
      setSeats("");
      setRating("");
      fetchCars();
    } catch {
      alert("Could not connect to the car service.");
    }
  }

  async function deleteCar(id: number) {
    if (!confirm("Are you sure you want to delete this car?")) return;
    try {
      const response = await fetch("/api/admin/cars/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Could not delete car.");
      fetchCars();
    } catch {
      alert("Could not connect to the car service.");
    }
  }

  async function updateCar(car: Car) {
    setUpdatingId(car.id);
    try {
      const response = await fetch("/api/admin/cars/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car)
      });
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Could not update car.");
      alert("Car updated successfully!");
      fetchCars();
    } catch {
      alert("Could not connect to the car service.");
    } finally {
      setUpdatingId(null);
    }
  }

  const handleCarChange = (index: number, field: keyof Car, value: string) => {
    const newCars = [...cars];
    newCars[index] = { ...newCars[index], [field]: value } as Car;
    setCars(newCars);
  };

  const filteredCars = cars.filter((car) =>
    (car.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className={`admin-page-wrapper ${theme === "dark" ? "theme-dark" : "theme-light"}`} onMouseMove={handleMouseMove}>
      <div className="admin-ambient-glow" />
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
            <span className="brand-tagline">YOUR JOURNEY, YOUR CAR, YOUR WAY. • Admin</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span>👑 Logged in as Admin: <strong>{adminName || "admin"}</strong></span>
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
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

      <h1 className="page-heading">Admin Page</h1>

      <div className="oiiiii">
        <div className="adminBox">
          <h2>Admin Panel</h2>

          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCar()} />
          <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCar()} />
          <input placeholder="Image URL" value={image} onChange={(e) => setImage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCar()} />
          <input placeholder="Mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCar()} />
          <input placeholder="Seats" value={seats} onChange={(e) => setSeats(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCar()} />
          <input placeholder="Rating" value={rating} onChange={(e) => setRating(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCar()} />

          <button onClick={addCar}>Add Car</button>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-header-row">
          <div>
            <h2 className="admin-table-title">All Cars ({cars.length})</h2>
            <p className="admin-table-subtitle">Edit car prices, specifications, or remove vehicles directly in the table</p>
          </div>
          <div className="admin-search-wrapper">
            <input
              type="text"
              className="admin-search-input"
              placeholder="🔍 Search cars by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  <th style={{ width: "90px" }}>Photo</th>
                  <th>Car Name</th>
                  <th style={{ width: "130px" }}>Price (₹)</th>
                  <th style={{ width: "130px" }}>Mileage</th>
                  <th style={{ width: "100px" }}>Seats</th>
                  <th style={{ width: "100px" }}>Rating</th>
                  <th style={{ width: "160px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-table-empty">
                      No cars found matching &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredCars.map((car, idx) => {
                    const originalIndex = cars.findIndex((c) => c.id === car.id);
                    const indexToUse = originalIndex !== -1 ? originalIndex : idx;

                    return (
                      <tr key={car.id || idx} className="admin-table-row">
                        <td className="admin-row-id">{car.id}</td>
                        <td>
                          <div className="admin-thumb-wrapper">
                            <Image
                              src={car.image?.trim() || "/abcdef.jpg"}
                              width={70}
                              height={45}
                              unoptimized
                              className="admin-thumb-img"
                              alt={car.name || "Car"}
                            />
                          </div>
                        </td>
                        <td className="admin-car-name-cell">
                          <strong>{car.name}</strong>
                        </td>
                        <td>
                          <input
                            className="admin-inline-input"
                            placeholder="Price"
                            value={car.price || ""}
                            onChange={(e) => handleCarChange(indexToUse, 'price', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateCar(car)}
                          />
                        </td>
                        <td>
                          <input
                            className="admin-inline-input"
                            placeholder="Mileage"
                            value={car.mileage || ""}
                            onChange={(e) => handleCarChange(indexToUse, 'mileage', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateCar(car)}
                          />
                        </td>
                        <td>
                          <input
                            className="admin-inline-input"
                            placeholder="Seats"
                            value={car.seats || ""}
                            onChange={(e) => handleCarChange(indexToUse, 'seats', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateCar(car)}
                          />
                        </td>
                        <td>
                          <input
                            className="admin-inline-input"
                            placeholder="Rating"
                            value={car.rating || ""}
                            onChange={(e) => handleCarChange(indexToUse, 'rating', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateCar(car)}
                          />
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              onClick={() => updateCar(car)}
                              className="admin-inline-btn-update"
                              disabled={updatingId === car.id}
                              title="Save changes"
                            >
                              {updatingId === car.id ? "Saving..." : "Update"}
                            </button>
                            <button
                              onClick={() => deleteCar(car.id)}
                              className="admin-inline-btn-delete"
                              title="Delete car"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}