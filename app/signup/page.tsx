"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "../globalss.css";

const CAR_SHOWCASE = [
  {
    name: "Luxury Sport Coupe",
    image: "/luxuriousCAR.jpg",
    tagline: "Unleash Pure Performance",
    badge: "Premium Class"
  },
  {
    name: "Mahindra XUV700",
    image: "/Mahindra XUV700.jpg",
    tagline: "Comfort & Power in Every Journey",
    badge: "Top Rated SUV"
  },
  {
    name: "Toyota Glanza",
    image: "/Toyota Glanza.jpg",
    tagline: "Smart City Driving & High Mileage",
    badge: "Best Fuel Economy"
  }
];

export default function Signup() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("app_theme") as "dark" | "light" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_theme", nextTheme);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const handleNameChange = (value: string) => {
    if (/\d/.test(value)) {
      setError("Numbers are not allowed in Name. Only letters are permitted.");
    } else if (error) {
      setError("");
    }
    const lettersOnly = value.replace(/[0-9]/g, "");
    setName(lettersOnly);
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name / username.");
      return;
    }
    if (/\d/.test(name) || !/^[a-zA-Z\s]+$/.test(name.trim())) {
      setError("Name cannot contain numbers. Only letters are allowed.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: name.trim(),
          password: password
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Signup failed. Please try a different username.");
        return;
      }
      alert("🎉 Account created successfully! Please login.");
      router.push("/");
    } catch {
      setError("Could not connect to the signup service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const currentCar = CAR_SHOWCASE[selectedCarIndex];

  return (
    <div
      className={`signup-page-wrapper ${theme === "dark" ? "theme-dark" : "theme-light"}`}
      onMouseMove={handleMouseMove}
    >
      <div className="signup-ambient-glow" />

      {/* Top Bar with Brand Logo and Theme Switcher */}
      <div className="signup-top-bar">
        <Link href="/" className="brand-logo-header brand-logo-link" style={{ textDecoration: "none" }}>
          <Image
            src="/al-logo.png"
            width={46}
            height={38}
            alt="AL Cars Logo"
            className="brand-logo-img"
            unoptimized
          />
          <div className="brand-title-wrap">
            <span className="brand-name">AL Cars</span>
            <span className="brand-tagline">YOUR JOURNEY, YOUR CAR, YOUR WAY.</span>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/" className="signup-back-link">
            ← Back to Login
          </Link>
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>

      <div className="signup-header-section">
        <span className="signup-badge">Join AL Cars</span>
        <h1 className="signup-title">Create Your Free Account</h1>
        <p className="signup-subtitle">Experience seamless vehicle booking with instant confirmation</p>
      </div>

      <div className="signup-main-container">
        {/* Interactive Car Showcase Card */}
        <div className="signup-car-showcase">
          <div className="signup-car-image-container">
            <Image
              src={currentCar.image}
              alt={currentCar.name}
              fill
              className="signup-car-image"
              unoptimized
            />
            <div className="signup-car-overlay">
              <span className="signup-car-tag">{currentCar.badge}</span>
              <h3 className="signup-car-name">{currentCar.name}</h3>
              <p className="signup-car-tagline">{currentCar.tagline}</p>
            </div>
          </div>

          {/* Interactive Car Selector Thumbnails */}
          <div className="signup-car-thumbnails">
            {CAR_SHOWCASE.map((car, idx) => (
              <button
                key={idx}
                type="button"
                className={`signup-thumb-btn ${idx === selectedCarIndex ? "active" : ""}`}
                onClick={() => setSelectedCarIndex(idx)}
                title={`View ${car.name}`}
              >
                <div className="signup-thumb-preview">
                  <Image
                    src={car.image}
                    alt={car.name}
                    width={70}
                    height={45}
                    className="signup-thumb-img"
                    unoptimized
                  />
                </div>
                <span>{car.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Signup Form Card */}
        <div className="signup-form-card">
          <div className="signup-card-header">
            <h2>Sign Up</h2>
            <p>Enter your details below to get started</p>
          </div>

          {error && <div className="signup-error-alert">{error}</div>}

          <form onSubmit={handleSignup} className="signup-form">
            <div className="signup-field">
              <label htmlFor="signup-username">Enter Your Name (Letters Only)</label>
              <div className="signup-input-wrapper">
                <input
                  id="signup-username"
                  type="text"
                  placeholder="e.g. John Doe (letters only)"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-password">Enter Password</label>
              <div className="signup-input-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="signup-input-wrapper">
                <input
                  id="signup-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" className="signup-btn-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="signup-footer-text">
              Already have an account? <Link href="/">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}