"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "./globalss.css";

const SLOGANS = [
  "✨ Your Journey, Your Car, Your Way.",
  "🚗 Drive The Best with AL Cars — Instant Booking & Best Price Guarantee",
  "⚡ Verified Roadside Support & Transparent Pricing — Your Way",
  "🌟 Premium Fleet with Zero Hidden Fees — Your Journey, Your Car, Your Way."
];

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sloganIndex, setSloganIndex] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("app_theme") as "dark" | "light" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % SLOGANS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_theme", nextTheme);
    }
  };

  const handleNameChange = (value: string) => {
    if (/\d/.test(value)) {
      setError("Numbers are not allowed in Name. Only letters are permitted.");
    } else if (error) {
      setError("");
    }
    const lettersOnly = value.replace(/[0-9]/g, "");
    setUsername(lettersOnly);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your name / username.");
      return;
    }
    if (/\d/.test(username) || !/^[a-zA-Z\s]+$/.test(username.trim())) {
      setError("Name cannot contain numbers. Only letters are allowed.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid username or password.");
        return;
      }

      localStorage.setItem("role", data.user.role);
      localStorage.setItem("username", data.user.username);
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/cars");
      }
    } catch {
      setError("Could not connect to the login service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    localStorage.setItem("role", "guest");
    localStorage.setItem("username", "Guest");
    router.push("/cars");
  }

  return (
    <div className={`loginpage ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      {/* Top Bar with Brand Logo on the Left and Theme Toggle on the Right */}
      <div className="login-top-bar">
        <div className="brand-logo-header">
          <Image
            src="/al-logo.png"
            width={48}
            height={40}
            alt="AL Cars Logo"
            className="brand-logo-img"
            unoptimized
          />
          <div className="brand-title-wrap">
            <span className="brand-name">AL Cars</span>
            <span className="brand-tagline">YOUR JOURNEY, YOUR CAR, YOUR WAY.</span>
          </div>
        </div>

        <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Interactive Slogan Banner */}
      <div className="interactive-slogan-container" onClick={() => setSloganIndex((prev) => (prev + 1) % SLOGANS.length)} title="Click to see next slogan">
        <span className="slogan-badge">HOT</span>
        <span className="slogan-text">{SLOGANS[sloganIndex]}</span>
        <span className="slogan-click-hint">↻ Click for more</span>
      </div>

      <div className="section">
        <p className="welcome-tag">Welcome To AL Cars</p>
        <h1 className="heading">Save up to 70% on luxury car rentals</h1>
        <p className="subheading">YOUR JOURNEY, YOUR CAR, YOUR WAY. — Clear prices, no surprises</p>
        <p className="trust-badges">
          <span>✔️ Trusted by 7M travelers</span>
          <span className="badge-sep">||</span>
          <span>✔️ 24/7 Roadside Support</span>
          <span className="badge-sep">||</span>
          <span>✔️ Free Cancellation</span>
        </p>
      </div>

      <div className="login-banner">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-brand">
              <Image src="/al-logo.png" width={40} height={34} alt="AL Cars" className="card-brand-logo" unoptimized />
              <h2>AL Cars Login</h2>
            </div>
            <p className="login-card-sub">Access your account or continue as guest</p>
          </div>

          {error && <div className="login-error-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="login-username">Enter Your Name (Letters Only)</label>
              <div className="login-input-wrapper">
                <input
                  id="login-username"
                  type="text"
                  placeholder="e.g. ajay or admin"
                  value={username}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Enter Password</label>
              <div className="login-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="current-password"
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

            <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <button type="button" onClick={handleGuest} className="login-btn-secondary">
              Continue as Guest
            </button>

            <p className="login-footer-text">
              New user? <Link href="/signup">Signup</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}