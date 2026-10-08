"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import "../globalss.css";

type PaymentMethod = "UPI" | "Cash" | "Card";
type CardNetwork = "RuPay" | "Visa" | "Mastercard";

function PaymentContent() {
  const params = useSearchParams();
  const router = useRouter();

  const name = params.get("name") || "Car Booking";
  const total = params.get("total") || "0";
  const bookingId = params.get("bookingId") || "";
  const pickupDate = params.get("pickupDate") || "";
  const returnDate = params.get("returnDate") || "";

  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>("RuPay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [userUpiId, setUserUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(299); // 4m 59s

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardError, setCardError] = useState("");

  // Countdown timer for UPI session
  useEffect(() => {
    if (method !== "UPI") return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [method]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("alcars@upi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Card formatting handlers
  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.match(/.{1,4}/g)?.join(" ") || digits;
    setCardNumber(formatted);
    if (cardError) setCardError("");
  };

  const handleCardNameChange = (value: string) => {
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "");
    setCardName(lettersOnly.toUpperCase());
    if (cardError) setCardError("");
  };

  const handleCardExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2, 4)}`);
    } else {
      setCardExpiry(digits);
    }
    if (cardError) setCardError("");
  };

  const handleCardCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(digits);
    if (cardError) setCardError("");
  };

  async function confirmPayment() {
    if (!bookingId || !pickupDate || !returnDate || Number(total) <= 0) {
      alert("Booking details are missing. Please start your booking again.");
      return;
    }

    // Validation per method
    if (method === "Card") {
      const cleanNumber = cardNumber.replace(/\s/g, "");
      if (cleanNumber.length !== 16) {
        setCardError("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardName.trim()) {
        setCardError("Please enter the cardholder name.");
        return;
      }
      if (cardExpiry.length !== 5) {
        setCardError("Please enter a valid expiry date (MM/YY).");
        return;
      }
      const [expMonth] = cardExpiry.split("/").map(Number);
      if (!expMonth || expMonth < 1 || expMonth > 12) {
        setCardError("Expiry month must be between 01 and 12.");
        return;
      }
      if (cardCvv.length < 3) {
        setCardError("Please enter a valid CVV (3 or 4 digits).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/booking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          total,
          payment: method,
          pickupDate,
          returnDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Could not confirm your booking.");
        return;
      }
      alert(`🎉 Your booking for ${name} is confirmed successfully via ${method}!`);
      router.push("/cars");
    } catch {
      alert("Could not connect to the booking service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="payment">
      <div className="payment-top-bar">
        <Link href="/cars" className="brand-logo-header brand-logo-link">
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
        </Link>
        <button
          onClick={() => router.push("/cars")}
          className="payment-back-btn"
        >
          ← Change Car
        </button>
      </div>

      <div className="payment-main-container">
        {/* Left Side: Order Summary Card */}
        <div className="payment-order-summary">
          <span className="payment-badge">Checkout & Secure Payment</span>
          <h2 className="payment-car-title">{name}</h2>
          <div className="payment-amount-display">
            <span className="payment-amount-label">Grand Total Amount</span>
            <div className="payment-amount-value">₹{Number(total).toLocaleString("en-IN")}</div>
          </div>

          <div className="payment-dates-box">
            <div className="payment-date-item">
              <span className="pdate-label">📅 Pickup Date</span>
              <strong className="pdate-val">{pickupDate || "Today"}</strong>
            </div>
            <div className="payment-date-divider">→</div>
            <div className="payment-date-item">
              <span className="pdate-label">🏁 Return Date</span>
              <strong className="pdate-val">{returnDate || "Not Set"}</strong>
            </div>
          </div>

          <div className="payment-perks">
            <div className="perk-item">🛡️ 100% Secure Encrypted Payment</div>
            <div className="perk-item">⚡ Instant Booking Confirmation</div>
            <div className="perk-item">🔄 Free Cancellation available</div>
          </div>
        </div>

        {/* Right Side: Interactive Payment Methods & Sub-screens */}
        <div className="payment-interactive-panel">
          {/* Method Tabs */}
          <div className="payment-tabs-header">
            <button
              type="button"
              className={`payment-tab-btn ${method === "UPI" ? "active" : ""}`}
              onClick={() => setMethod("UPI")}
            >
              <span className="tab-icon">📱</span>
              <span className="tab-title">UPI / QR</span>
            </button>
            <button
              type="button"
              className={`payment-tab-btn ${method === "Cash" ? "active" : ""}`}
              onClick={() => setMethod("Cash")}
            >
              <span className="tab-icon">💵</span>
              <span className="tab-title">Pay Cash</span>
            </button>
            <button
              type="button"
              className={`payment-tab-btn ${method === "Card" ? "active" : ""}`}
              onClick={() => setMethod("Card")}
            >
              <span className="tab-icon">💳</span>
              <span className="tab-title">Credit / Debit Card</span>
            </button>
          </div>

          {/* ============================================================
              1. UPI PAYMENT SCREEN (QR Scanner & UPI Apps)
             ============================================================ */}
          {method === "UPI" && (
            <div className="payment-subscreen upi-subscreen">
              <div className="upi-header-row">
                <div>
                  <h3 className="subscreen-title">Scan QR & Pay with UPI</h3>
                  <p className="subscreen-desc">Scan using Google Pay, PhonePe, Paytm, BHIM or any UPI app</p>
                </div>
                <div className="upi-timer-badge">
                  ⏱️ Expires in: <strong>{formatTimer(timerSeconds)}</strong>
                </div>
              </div>

              <div className="upi-qr-card">
                <div className="upi-qr-frame">
                  {/* Decorative QR Pattern with AL Cars Central Emblem */}
                  <svg
                    className="upi-qr-svg"
                    viewBox="0 0 200 200"
                    width="190"
                    height="190"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="200" height="200" fill="#ffffff" rx="14" />
                    {/* Top-Left Finder */}
                    <rect x="16" y="16" width="44" height="44" rx="6" fill="#0f172a" />
                    <rect x="22" y="22" width="32" height="32" rx="4" fill="#ffffff" />
                    <rect x="28" y="28" width="20" height="20" rx="3" fill="#ea580c" />

                    {/* Top-Right Finder */}
                    <rect x="140" y="16" width="44" height="44" rx="6" fill="#0f172a" />
                    <rect x="146" y="22" width="32" height="32" rx="4" fill="#ffffff" />
                    <rect x="152" y="28" width="20" height="20" rx="3" fill="#ea580c" />

                    {/* Bottom-Left Finder */}
                    <rect x="16" y="140" width="44" height="44" rx="6" fill="#0f172a" />
                    <rect x="22" y="146" width="32" height="32" rx="4" fill="#ffffff" />
                    <rect x="28" y="152" width="20" height="20" rx="3" fill="#ea580c" />

                    {/* QR Data Grid Matrix Simulation */}
                    <path
                      d="M68 20h8v8h-8z M84 20h8v8h-8z M100 20h8v8h-8z M116 20h8v8h-8z
                         M68 36h8v8h-8z M92 36h8v8h-8z M124 36h8v8h-8z
                         M68 52h8v8h-8z M84 52h8v8h-8z M108 52h8v8h-8z
                         M20 68h8v8h-8z M36 68h8v8h-8z M52 68h8v8h-8z M68 68h8v8h-8z M84 68h8v8h-8z M100 68h8v8h-8z M116 68h8v8h-8z M140 68h8v8h-8z M156 68h8v8h-8z M172 68h8v8h-8z
                         M20 84h8v8h-8z M44 84h8v8h-8z M68 84h8v8h-8z M124 84h8v8h-8z M148 84h8v8h-8z M172 84h8v8h-8z
                         M20 100h8v8h-8z M52 100h8v8h-8z M140 100h8v8h-8z M164 100h8v8h-8z
                         M20 116h8v8h-8z M36 116h8v8h-8z M68 116h8v8h-8z M84 116h8v8h-8z M100 116h8v8h-8z M116 116h8v8h-8z M148 116h8v8h-8z M172 116h8v8h-8z
                         M68 140h8v8h-8z M92 140h8v8h-8z M108 140h8v8h-8z M124 140h8v8h-8z M140 140h8v8h-8z M164 140h8v8h-8z
                         M68 156h8v8h-8z M84 156h8v8h-8z M116 156h8v8h-8z M148 156h8v8h-8z M172 156h8v8h-8z
                         M68 172h8v8h-8z M100 172h8v8h-8z M124 172h8v8h-8z M156 172h8v8h-8z"
                      fill="#0f172a"
                    />

                    {/* Center Logo Badge */}
                    <rect x="76" y="76" width="48" height="48" rx="10" fill="#facc15" stroke="#ea580c" strokeWidth="2.5" />
                    <text x="100" y="104" fontSize="11" fontWeight="900" textAnchor="middle" fill="#7c2d12" fontFamily="sans-serif">
                      AL CARS
                    </text>
                  </svg>
                  <div className="upi-scan-laser" />
                </div>

                <div className="upi-qr-details">
                  <div className="upi-amount-pill">
                    Amount to Pay: <strong>₹{Number(total).toLocaleString("en-IN")}</strong>
                  </div>

                  <div className="upi-id-box">
                    <span className="upi-id-label">UPI ID:</span>
                    <code className="upi-id-text">alcars@upi</code>
                    <button
                      type="button"
                      className="upi-copy-btn"
                      onClick={handleCopyUpi}
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? "✓ Copied!" : "📋 Copy"}
                    </button>
                  </div>

                  {/* Supported UPI Apps */}
                  <div className="upi-supported-apps">
                    <span className="app-badge gpay">Google Pay</span>
                    <span className="app-badge phonepe">PhonePe</span>
                    <span className="app-badge paytm">Paytm</span>
                    <span className="app-badge bhim">BHIM</span>
                  </div>
                </div>
              </div>

              {/* Enter Custom UPI ID */}
              <div className="upi-input-section">
                <label htmlFor="user-upi-input">Or Enter Your VPA / UPI ID:</label>
                <div className="upi-input-row">
                  <input
                    id="user-upi-input"
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={userUpiId}
                    onChange={(e) => {
                      setUserUpiId(e.target.value);
                      if (upiVerified) setUpiVerified(false);
                    }}
                  />
                  <button
                    type="button"
                    className="upi-verify-btn"
                    onClick={() => {
                      if (userUpiId.includes("@")) {
                        setUpiVerified(true);
                      } else {
                        alert("Please enter a valid UPI ID (e.g. mobile@upi or name@okaxis)");
                      }
                    }}
                  >
                    {upiVerified ? "✓ Verified" : "Verify UPI"}
                  </button>
                </div>
                {upiVerified && (
                  <p className="upi-verified-msg">✨ Verified! Payment collect request will be sent to {userUpiId}</p>
                )}
              </div>

              <button
                type="button"
                className="payment-confirm-btn upi-pay-btn"
                onClick={confirmPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing Payment..." : `✓ Confirm UPI Payment (₹${Number(total).toLocaleString("en-IN")})`}
              </button>
            </div>
          )}

          {/* ============================================================
              2. CASH PAYMENT SCREEN (Order Confirm)
             ============================================================ */}
          {method === "Cash" && (
            <div className="payment-subscreen cash-subscreen">
              <div className="cash-hero-banner">
                <div className="cash-icon-large">💵</div>
                <h3 className="cash-title">Pay Cash on Vehicle Pickup</h3>
                <p className="cash-subtitle">No advance payment required. Pay in cash directly at handover.</p>
              </div>

              <div className="cash-order-summary-box">
                <h4>Order Confirmation Details</h4>
                <div className="cash-summary-row">
                  <span>🚗 Selected Vehicle:</span>
                  <strong>{name}</strong>
                </div>
                <div className="cash-summary-row">
                  <span>📅 Pickup Date:</span>
                  <strong>{pickupDate || "Today"}</strong>
                </div>
                <div className="cash-summary-row">
                  <span>🏁 Return Date:</span>
                  <strong>{returnDate || "Not Specified"}</strong>
                </div>
                <div className="cash-summary-row total-highlight">
                  <span>💰 Cash Amount Due on Pickup:</span>
                  <strong>₹{Number(total).toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <div className="cash-guidelines-box">
                <h5>📋 Important Pickup Guidelines:</h5>
                <ul>
                  <li>Please carry your original <strong>Driving License</strong> & valid <strong>Government ID proof</strong> (Aadhar/Passport).</li>
                  <li>Keep exact cash amount of <strong>₹{Number(total).toLocaleString("en-IN")}</strong> ready at pickup time.</li>
                  <li>Vehicle condition inspection is done jointly before key handover.</li>
                  <li>Free cancellation anytime before car delivery.</li>
                </ul>
              </div>

              <button
                type="button"
                className="payment-confirm-btn cash-confirm-btn"
                onClick={confirmPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirming Order..." : `✅ Confirm Order (Pay ₹${Number(total).toLocaleString("en-IN")} on Pickup)`}
              </button>
            </div>
          )}

          {/* ============================================================
              3. CREDIT / DEBIT CARD SCREEN (RuPay / Visa / Mastercard)
             ============================================================ */}
          {method === "Card" && (
            <div className="payment-subscreen card-subscreen">
              <div className="card-header-row">
                <h3 className="subscreen-title">Pay via Credit / Debit Card</h3>
                <p className="subscreen-desc">Select your card network and enter your card details below</p>
              </div>

              {/* Card Network Selector */}
              <div className="card-network-selector">
                <button
                  type="button"
                  className={`network-chip ${cardNetwork === "RuPay" ? "active rupay" : ""}`}
                  onClick={() => setCardNetwork("RuPay")}
                >
                  <span className="network-flag">🇮🇳</span>
                  <strong>RuPay</strong>
                </button>
                <button
                  type="button"
                  className={`network-chip ${cardNetwork === "Visa" ? "active visa" : ""}`}
                  onClick={() => setCardNetwork("Visa")}
                >
                  <span className="network-flag">💳</span>
                  <strong>VISA</strong>
                </button>
                <button
                  type="button"
                  className={`network-chip ${cardNetwork === "Mastercard" ? "active mastercard" : ""}`}
                  onClick={() => setCardNetwork("Mastercard")}
                >
                  <span className="network-flag">🔴🟡</span>
                  <strong>Mastercard</strong>
                </button>
              </div>

              {/* Interactive Virtual Card Preview */}
              <div className={`virtual-card-preview ${cardNetwork.toLowerCase()}`}>
                <div className="vcard-top">
                  <div className="vcard-chip" />
                  <div className="vcard-contactless">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M8.5 16.5a5 5 0 0 1 0-9M12 19a8.5 8.5 0 0 0 0-14M15.5 21.5a12 12 0 0 0 0-19" />
                    </svg>
                  </div>
                  <div className="vcard-network-badge">{cardNetwork}</div>
                </div>

                <div className="vcard-number">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                <div className="vcard-bottom">
                  <div className="vcard-holder">
                    <span className="vcard-label">CARD HOLDER</span>
                    <strong className="vcard-val">{cardName || "YOUR NAME"}</strong>
                  </div>
                  <div className="vcard-expiry">
                    <span className="vcard-label">EXPIRES</span>
                    <strong className="vcard-val">{cardExpiry || "MM/YY"}</strong>
                  </div>
                </div>
              </div>

              {/* Card Form */}
              {cardError && <div className="card-error-banner">⚠️ {cardError}</div>}

              <div className="card-form-grid">
                <div className="card-input-group full-width">
                  <label htmlFor="card-num-input">Card Number ({cardNetwork})</label>
                  <div className="card-input-wrap">
                    <input
                      id="card-num-input"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      maxLength={19}
                      autoComplete="cc-number"
                    />
                    <span className="card-network-icon">{cardNetwork}</span>
                  </div>
                </div>

                <div className="card-input-group full-width">
                  <label htmlFor="card-name-input">Cardholder Name (Letters Only)</label>
                  <input
                    id="card-name-input"
                    type="text"
                    placeholder="e.g. AKASH SHARMA"
                    value={cardName}
                    onChange={(e) => handleCardNameChange(e.target.value)}
                    autoComplete="cc-name"
                  />
                </div>

                <div className="card-input-group">
                  <label htmlFor="card-exp-input">Expiry Date</label>
                  <input
                    id="card-exp-input"
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => handleCardExpiryChange(e.target.value)}
                    maxLength={5}
                    autoComplete="cc-exp"
                  />
                </div>

                <div className="card-input-group">
                  <label htmlFor="card-cvv-input">CVV / CVC</label>
                  <input
                    id="card-cvv-input"
                    type="password"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => handleCardCvvChange(e.target.value)}
                    maxLength={4}
                    autoComplete="cc-csc"
                  />
                </div>
              </div>

              <button
                type="button"
                className="payment-confirm-btn card-pay-btn"
                onClick={confirmPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing Transaction..." : `🔒 Pay ₹${Number(total).toLocaleString("en-IN")} via ${cardNetwork}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="payment-loading">Loading payment gateway...</div>}>
      <PaymentContent />
    </Suspense>
  );
}