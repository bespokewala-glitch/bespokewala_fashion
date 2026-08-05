"use client";

import React, { useState } from "react";

/* ── Order status steps ── */
const STEPS = [
  { key: "placed",     icon: "🛍️", label: "Order Placed"   },
  { key: "confirmed",  icon: "✅", label: "Confirmed"       },
  { key: "processing", icon: "🔍", label: "Quality Check"  },
  { key: "shipped",    icon: "🚚", label: "Dispatched"      },
  { key: "delivered",  icon: "🏠", label: "Delivered"       },
];

/* ── Simulate a lookup (replace with real API call) ── */
async function lookupOrder(orderId: string, email: string) {
  // Stub: in production, call your real orders API endpoint
  await new Promise(r => setTimeout(r, 1400));

  // Demo: any valid-looking order ID returns a mock result
  const clean = orderId.trim().toUpperCase();
  if (!clean.startsWith("BSW") && clean.length < 6) return null;

  return {
    id: clean,
    status: "shipped" as const,
    date: "02 Aug 2026",
    eta: "07 Aug 2026",
    courier: "Blue Dart",
    trackingNumber: "BD7834901234",
    trackingUrl: "https://www.bluedart.com/tracking",
    items: [
      { name: "Embroidered Silk Lehenga", qty: 1, size: "M", color: "Ivory Gold" },
      { name: "Zardozi Dupatta", qty: 1, size: "Free Size", color: "Ivory" },
    ],
    timeline: [
      { status: "placed",     date: "02 Aug 2026, 10:32 AM", note: "Order received and payment confirmed." },
      { status: "confirmed",  date: "02 Aug 2026, 11:15 AM", note: "Order verified and sent to atelier." },
      { status: "processing", date: "03 Aug 2026, 02:00 PM", note: "Quality inspection passed." },
      { status: "shipped",    date: "04 Aug 2026, 09:45 AM", note: "Dispatched via Blue Dart. AWB: BD7834901234" },
    ],
  };
}

type OrderData = Awaited<ReturnType<typeof lookupOrder>>;

export default function TrackOrderContent() {
  const [orderId, setOrderId]   = useState("");
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [order, setOrder]       = useState<OrderData>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    if (!orderId.trim() || !email.trim()) {
      setError("Please enter both your order ID and email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await lookupOrder(orderId, email);
      if (!result) {
        setError("We couldn't find an order matching those details. Please check and try again.");
      } else {
        setOrder(result);
      }
    } catch {
      setError("Something went wrong. Please try again or contact us.");
    } finally {
      setLoading(false);
    }
  };

  const activeIndex = order ? STEPS.findIndex(s => s.key === order.status) : -1;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .track-fade { animation: fadeUp 0.6s ease both; }

        .track-input {
          width: 100%;
          padding: 0.9rem 1rem;
          border: 1px solid #e0d8ce;
          background: #fff;
          font-family: var(--font-josefin-sans), sans-serif;
          font-size: 0.875rem;
          color: #1c1c1c;
          letter-spacing: 0.03em;
          outline: none;
          transition: border-color 0.25s;
          border-radius: 0;
          -webkit-appearance: none;
        }
        .track-input:focus { border-color: #d2b48c; }
        .track-input::placeholder { color: #bbb; }

        /* ── progress bar ── */
        .step-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          margin-bottom: 2.5rem;
        }
        .step-bar::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0; right: 0;
          height: 2px;
          background: #e8e0d6;
          z-index: 0;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          z-index: 1;
          flex: 1;
          text-align: center;
        }
        .step-circle {
          width: 42px; height: 42px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          border: 2px solid #e8e0d6;
          background: #fff;
          position: relative;
          z-index: 2;
        }
        .step-circle.done {
          background: #1c1c1c;
          border-color: #1c1c1c;
        }
        .step-circle.active {
          background: #fff;
          border-color: #d2b48c;
          box-shadow: 0 0 0 4px rgba(210,180,140,0.2);
        }
        .step-label {
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #aaa;
        }
        .step-label.done  { color: #1c1c1c; font-weight: 600; }
        .step-label.active { color: #d2b48c; font-weight: 600; }

        /* ── timeline ── */
        .timeline-item {
          display: flex;
          gap: 1.25rem;
          padding-bottom: 1.5rem;
          position: relative;
        }
        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 32px;
          bottom: 0;
          width: 2px;
          background: #e8e0d6;
        }
        .timeline-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #1c1c1c;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem;
          color: #d2b48c;
          flex-shrink: 0;
          z-index: 1;
        }

        /* ── order card ── */
        .order-card {
          background: #fff;
          border: 1px solid #e8e0d6;
          padding: 1.5rem;
          margin-bottom: 1.25rem;
        }

        /* ── responsive ── */
        .track-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 3.5rem;
          align-items: start;
        }
        @media (max-width: 860px) {
          .track-grid { grid-template-columns: 1fr; gap: 2rem; }
          .step-bar   { gap: 0.5rem; }
          .step-circle { width: 34px; height: 34px; font-size: 0.9rem; }
          .step-label  { font-size: 0.55rem; }
        }
        @media (max-width: 480px) {
          .step-label { display: none; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(135deg, #1c1c1c 0%, #2d2520 60%, #3d352e 100%)",
        color: "#fff",
        padding: "clamp(7rem,15vw,10rem) 1.5rem clamp(3rem,8vw,5.5rem)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.25rem" }}>
          Real-Time Updates
        </p>
        <h1 style={{ fontSize: "clamp(2rem,7vw,3.75rem)", fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Track Your Order
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.5rem" }} />
        <p style={{ fontSize: "clamp(0.85rem,2vw,0.95rem)", fontWeight: 300, maxWidth: "480px", margin: "0 auto", lineHeight: 1.8, color: "rgba(255,255,255,0.72)" }}>
          Enter your order ID and the email address used at checkout to see the latest status of your Bespoken order.
        </p>
      </section>

      {/* ── LOOKUP FORM ── */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3rem,8vw,5.5rem) 1.5rem" }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <div className="track-grid">

            {/* ── Left: Form ── */}
            <div className="track-fade">
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>
                Order Lookup
              </p>
              <h2 style={{ fontSize: "clamp(1.3rem,2.5vw,1.6rem)", fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", color: "#1c1c1c", marginBottom: "0" }}>
                Find Your Order
              </h2>
              <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem 0 2rem" }} />

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.5rem" }}>
                    Order ID *
                  </label>
                  <input
                    className="track-input"
                    type="text"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    placeholder="e.g. BSW-20260802-001"
                    required
                  />
                  <p style={{ fontSize: "0.72rem", color: "#bbb", marginTop: "0.4rem" }}>
                    Found in your confirmation email subject line.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.5rem" }}>
                    Email Address *
                  </label>
                  <input
                    className="track-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {error && (
                  <p style={{ fontSize: "0.8rem", color: "#c0392b", padding: "0.75rem 1rem", background: "#fdf2f2", border: "1px solid #f5c6c6" }}>
                    ⚠ {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ alignSelf: "flex-start", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
                >
                  {loading ? "Searching…" : "Track Order →"}
                </button>
              </form>

              {/* Help box */}
              <div style={{ marginTop: "2.5rem", padding: "1.5rem", background: "#fff", border: "1px solid #e8e0d6" }}>
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>
                  Need Help?
                </p>
                <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.75 }}>
                  Can&apos;t find your order ID? Check your inbox for an email from{" "}
                  <strong>bespokewala@gmail.com</strong> with the subject &ldquo;Your Bespoken Order Confirmation&rdquo;.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  <a href="mailto:bespokewala@gmail.com" style={{ fontSize: "0.78rem", color: "#d2b48c", textDecoration: "none", letterSpacing: "0.05em" }}>
                    ✉ Email Support
                  </a>
                  <a href="https://wa.me/917506767452" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.78rem", color: "#25D366", textDecoration: "none", letterSpacing: "0.05em" }}>
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* ── Right: Result ── */}
            <div>
              {!order && !loading && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", border: "1px solid #e8e0d6" }}>
                  <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>📦</span>
                  <p style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.8 }}>
                    Enter your order details on the left<br />and your tracking information will appear here.
                  </p>
                </div>
              )}

              {loading && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", border: "1px solid #e8e0d6" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
                  <p style={{ fontSize: "0.85rem", color: "#888", letterSpacing: "0.05em" }}>Searching for your order…</p>
                </div>
              )}

              {order && (
                <div className="track-fade">
                  {/* Order header */}
                  <div className="order-card" style={{ borderLeft: "4px solid #d2b48c" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div>
                        <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "0.3rem" }}>Order ID</p>
                        <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1c1c1c" }}>{order.id}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "0.3rem" }}>Placed On</p>
                        <p style={{ fontSize: "0.875rem", color: "#1c1c1c" }}>{order.date}</p>
                      </div>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.35rem 0.875rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#15803d", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="order-card">
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "1.5rem" }}>Delivery Progress</p>
                    <div className="step-bar">
                      {STEPS.map((s, i) => {
                        const isDone   = i < activeIndex;
                        const isActive = i === activeIndex;
                        return (
                          <div key={s.key} className="step-item">
                            <div className={`step-circle ${isDone ? "done" : isActive ? "active" : ""}`}>
                              {isDone ? "✓" : s.icon}
                            </div>
                            <span className={`step-label ${isDone ? "done" : isActive ? "active" : ""}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#555", textAlign: "center" }}>
                      Estimated Delivery: <strong style={{ color: "#1c1c1c" }}>{order.eta}</strong>
                    </p>
                  </div>

                  {/* Courier info */}
                  <div className="order-card">
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "1rem" }}>Courier Details</p>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                      <div>
                        <p style={{ fontSize: "0.75rem", color: "#888" }}>Courier Partner</p>
                        <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1c1c1c" }}>{order.courier}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.75rem", color: "#888" }}>Tracking Number</p>
                        <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1c1c1c" }}>{order.trackingNumber}</p>
                      </div>
                    </div>
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: "0.75rem" }}>
                      Track on {order.courier} →
                    </a>
                  </div>

                  {/* Items */}
                  <div className="order-card">
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "1rem" }}>Items in This Order</p>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: i < order.items.length - 1 ? "1px solid #f0ebe4" : "none" }}>
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1c1c1c" }}>{item.name}</p>
                          <p style={{ fontSize: "0.75rem", color: "#888" }}>Size: {item.size} &nbsp;·&nbsp; {item.color}</p>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#999", flexShrink: 0 }}>Qty: {item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="order-card">
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "1.5rem" }}>Order Timeline</p>
                    {order.timeline.map((t, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-dot">
                          {STEPS.find(s => s.key === t.status)?.icon ?? "•"}
                        </div>
                        <div style={{ paddingTop: "0.25rem" }}>
                          <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.2rem" }}>
                            {STEPS.find(s => s.key === t.status)?.label}
                          </p>
                          <p style={{ fontSize: "0.875rem", color: "#1c1c1c", marginBottom: "0.2rem" }}>{t.note}</p>
                          <p style={{ fontSize: "0.75rem", color: "#aaa" }}>{t.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── COURIER PARTNERS STRIP ── */}
      <section style={{ backgroundColor: "#fff", padding: "3rem 1.5rem", borderTop: "1px solid #e8e0d6" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#999", marginBottom: "1.5rem" }}>
            Our Courier Partners
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { name: "Blue Dart",  href: "https://www.bluedart.com/tracking" },
              { name: "Delhivery", href: "https://www.delhivery.com/tracking" },
              { name: "FedEx",     href: "https://www.fedex.com/en-in/tracking.html" },
              { name: "DHL",       href: "https://www.dhl.com/in-en/home/tracking.html" },
            ].map(({ name, href }) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: "0.75rem" }}>
                {name} →
              </a>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "#bbb", marginTop: "1.25rem" }}>
            Use your courier tracking number above to track directly on the courier&apos;s website.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "clamp(3rem,7vw,4.5rem) 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1rem" }}>Order Support</p>
        <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
          Need Help with Your Order?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#aaa", maxWidth: "420px", margin: "0 auto 2rem", lineHeight: 1.8 }}>
          Our support team is available Mon–Sat, 10am–8pm IST. We typically respond to emails within 24 hours.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <a href="/contact"                className="btn-primary">Contact Us</a>
          <a href="https://wa.me/917506767452?text=Hi%2C%20I%20need%20help%20with%20my%20order." target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ color: "#fff", borderColor: "#fff" }}>
            WhatsApp →
          </a>
        </div>
      </section>
    </>
  );
}
