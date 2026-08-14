/* Pure server-compatible component — zero useState/useEffect, zero hydration risk.
 All animations via CSS @keyframes, all hover via CSS :hover.                     */

import Link from 'next/link';

export default function ShippingPageContent() {
  return (
    <>
      <style>{`
        /* ── entrance animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ship-fade { animation: fadeUp 0.7s ease both; }
        .ship-fade-d1 { animation-delay: 0.08s; }
        .ship-fade-d2 { animation-delay: 0.16s; }
        .ship-fade-d3 { animation-delay: 0.24s; }
        .ship-fade-d4 { animation-delay: 0.32s; }

        /* ── shipping rate cards ── */
        .ship-card {
          background: #fff;
          border: 1px solid #e8e0d6;
          padding: 2rem 1.75rem;
          border-bottom: 3px solid transparent;
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
        }
        .ship-card:hover {
          border-bottom-color: #d2b48c;
          box-shadow: 0 8px 28px rgba(0,0,0,0.06);
          transform: translateY(-3px);
        }
        .ship-card-free { border-bottom-color: #4caf7d; }
        .ship-card-free:hover { border-bottom-color: #4caf7d; }

        /* ── policy accordion-style rows ── */
        .policy-row {
          border-bottom: 1px solid #e8e0d6;
          padding: 1.75rem 0;
        }
        .policy-row:first-child { border-top: 1px solid #e8e0d6; }

        /* ── step tracker ── */
        .step-connector {
          width: 2px;
          height: 40px;
          background: linear-gradient(to bottom, #d2b48c, #e8e0d6);
          margin: 0.4rem auto;
        }

        /* ── FAQ items ── */
        .faq-item {
          border-bottom: 1px solid #e8e0d6;
          padding: 1.5rem 0;
        }
        .faq-item:first-child { border-top: 1px solid #e8e0d6; }

        /* ── table ── */
        .ship-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .ship-table th {
          background: #1c1c1c;
          color: #d2b48c;
          text-align: left;
          padding: 0.875rem 1rem;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .ship-table td {
          padding: 0.875rem 1rem;
          color: #444;
          line-height: 1.6;
          border-bottom: 1px solid #f0ebe4;
        }
        .ship-table tr:last-child td { border-bottom: none; }
        .ship-table tr:nth-child(even) td { background: #faf9f7; }

        /* ── notice banner ── */
        .ship-notice {
          background: linear-gradient(135deg, #faf3e8 0%, #fdf8f0 100%);
          border: 1px solid #e8d9bc;
          border-left: 4px solid #d2b48c;
          padding: 1.25rem 1.5rem;
          display: flex;
          gap: 0.875rem;
          align-items: flex-start;
          font-size: 0.875rem;
          color: #5a4a30;
          line-height: 1.7;
        }

        /* ── responsive ── */
        .ship-rate-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .ship-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }
        .ship-steps {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          text-align: center;
          position: relative;
        }
        .ship-steps::before {
          content: '';
          position: absolute;
          top: 22px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(to right, #d2b48c, #e8e0d6);
          z-index: 0;
        }

        @media (max-width: 900px) {
          .ship-rate-grid  { grid-template-columns: 1fr 1fr; }
          .ship-two-col    { grid-template-columns: 1fr; gap: 2rem; }
          .ship-steps      { grid-template-columns: 1fr 1fr; gap: 1.5rem; }
          .ship-steps::before { display: none; }
        }
        @media (max-width: 540px) {
          .ship-rate-grid  { grid-template-columns: 1fr; }
          .ship-steps      { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section style={{
        background: "linear-gradient(135deg, #1c1c1c 0%, #2d2520 60%, #3d352e 100%)",
        color: "#fff",
        padding: "clamp(7rem,15vw,10rem) 1.5rem clamp(3rem,8vw,5rem)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.25rem" }}>
          Delivery &amp; Returns
        </p>
        <h1 style={{ fontSize: "clamp(2rem,7vw,3.75rem)", fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Shipping &amp; Returns
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.5rem" }} />
        <p style={{ fontSize: "clamp(0.85rem,2vw,0.975rem)", fontWeight: 300, maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, color: "rgba(255,255,255,0.72)" }}>
          Every Bespokewala order is handled with the same care that goes into crafting each piece —
          packed, insured, and delivered safely to your door.
        </p>
      </section>

      {/* ══════════════════════════════════
          FREE SHIPPING BANNER
      ══════════════════════════════════ */}
      <section style={{ background: "linear-gradient(90deg, #4caf7d 0%, #3a9468 100%)", color: "#fff", padding: "1rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.85rem", letterSpacing: "0.08em", fontWeight: 500 }}>
          🎉 &nbsp; FREE SHIPPING on all orders above <strong>₹15,000</strong> within India &nbsp;|&nbsp; Free International Shipping on orders above <strong>₹1,00,000</strong>
        </p>
      </section>

      {/* ══════════════════════════════════
          DOMESTIC SHIPPING RATES
      ══════════════════════════════════ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>India</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Domestic Shipping
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div className="ship-rate-grid">
            {/* Free */}
            <div className="ship-card ship-card-free ship-fade">
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>🚚</div>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#4caf7d", marginBottom: "0.5rem", fontWeight: 600 }}>Free Delivery</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 600, color: "#1c1c1c", marginBottom: "0.5rem" }}>₹0</p>
              <p style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.6 }}>On orders above ₹15,000</p>
              <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.75rem" }}>Delivered in <strong>5–7 business days</strong></p>
            </div>

            {/* Standard */}
            <div className="ship-card ship-fade ship-fade-d1">
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>📦</div>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.5rem", fontWeight: 600 }}>Standard Shipping</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 600, color: "#1c1c1c", marginBottom: "0.5rem" }}>₹199</p>
              <p style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.6 }}>Orders below ₹15,000</p>
              <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.75rem" }}>Delivered in <strong>5–7 business days</strong></p>
            </div>

            {/* Express */}
            <div className="ship-card ship-fade ship-fade-d2">
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>⚡</div>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.5rem", fontWeight: 600 }}>Express Shipping</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 600, color: "#1c1c1c", marginBottom: "0.5rem" }}>₹499</p>
              <p style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.6 }}>Priority handling &amp; dispatch</p>
              <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.75rem" }}>Delivered in <strong>2–3 business days</strong></p>
            </div>
          </div>

          {/* Category Delivery Breakdown */}
          <div style={{ marginTop: "3rem", padding: "2rem", backgroundColor: "#fff", border: "1px solid #e8e0d6", borderRadius: "4px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1c1c1c", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              ⏱️ Category-Specific Delivery Timelines
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
              <div style={{ padding: "1.25rem", backgroundColor: "#faf9f7", borderLeft: "4px solid #d2b48c" }}>
                <p style={{ fontWeight: 600, color: "#1c1c1c", marginBottom: "0.35rem", fontSize: "0.9rem" }}>👠 Footwear Collection</p>
                <p style={{ fontSize: "0.85rem", color: "#555", margin: 0, lineHeight: 1.6 }}>Custom handcrafted &amp; delivered in <strong>15 to 20 Days</strong>.</p>
              </div>
              <div style={{ padding: "1.25rem", backgroundColor: "#faf9f7", borderLeft: "4px solid #d2b48c" }}>
                <p style={{ fontWeight: 600, color: "#1c1c1c", marginBottom: "0.35rem", fontSize: "0.9rem" }}>👑 Couture &amp; Bespoke</p>
                <p style={{ fontSize: "0.85rem", color: "#555", margin: 0, lineHeight: 1.6 }}>Handcrafted couture created &amp; delivered in <strong>40 to 45 Days</strong>.</p>
              </div>
              <div style={{ padding: "1.25rem", backgroundColor: "#faf9f7", borderLeft: "4px solid #d2b48c" }}>
                <p style={{ fontWeight: 600, color: "#1c1c1c", marginBottom: "0.35rem", fontSize: "0.9rem" }}>✨ Accessories &amp; Jewellery</p>
                <p style={{ fontSize: "0.85rem", color: "#555", margin: 0, lineHeight: 1.6 }}>Ready-to-wear pieces dispatched &amp; delivered in <strong>5 to 7 Business Days</strong>.</p>
              </div>
            </div>
          </div>

          {/* Domestic table */}
          <div style={{ marginTop: "2.5rem", overflowX: "auto" }}>
            <table className="ship-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Regions Covered</th>
                  <th>Standard (Days)</th>
                  <th>Express (Days)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Metro Cities</td><td>Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, Pune</td><td>3–5</td><td>1–2</td></tr>
                <tr><td>Tier 2 Cities</td><td>Ahmedabad, Jaipur, Surat, Lucknow, Chandigarh, Indore, etc.</td><td>4–6</td><td>2–3</td></tr>
                <tr><td>Rest of India</td><td>All other serviceable pin codes</td><td>6–8</td><td>3–5</td></tr>
                <tr><td>Remote / North-East</td><td>J&amp;K, Ladakh, Andaman, Lakshadweep, Remote NE States</td><td>8–12</td><td>5–7</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          INTERNATIONAL SHIPPING
      ══════════════════════════════════ */}
      <section style={{ backgroundColor: "#fff", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Worldwide</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              International Shipping
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
            <table className="ship-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Countries</th>
                  <th>Shipping Cost</th>
                  <th>Delivery Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>South Asia</strong></td>
                  <td>UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman</td>
                  <td>₹1,200 &nbsp;|&nbsp; Free above ₹75,000</td>
                  <td>5–8 business days</td>
                </tr>
                <tr>
                  <td><strong>USA &amp; Canada</strong></td>
                  <td>United States, Canada</td>
                  <td>₹2,500 &nbsp;|&nbsp; Free above ₹1,00,000</td>
                  <td>8–12 business days</td>
                </tr>
                <tr>
                  <td><strong>UK &amp; Europe</strong></td>
                  <td>UK, Germany, France, Netherlands, Italy, Sweden, and 20+ more</td>
                  <td>₹2,200 &nbsp;|&nbsp; Free above ₹1,00,000</td>
                  <td>7–10 business days</td>
                </tr>
                <tr>
                  <td><strong>Australia &amp; NZ</strong></td>
                  <td>Australia, New Zealand</td>
                  <td>₹2,800 &nbsp;|&nbsp; Free above ₹1,00,000</td>
                  <td>10–14 business days</td>
                </tr>
                <tr>
                  <td><strong>Rest of World</strong></td>
                  <td>Singapore, Malaysia, South Africa, and other serviceable countries</td>
                  <td>₹3,000 &nbsp;|&nbsp; Free above ₹1,00,000</td>
                  <td>12–18 business days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ship-notice">
            <span style={{ fontSize: "1.2rem", flexShrink: 0, lineHeight: 1.5 }}>ℹ️</span>
            <span>
              <strong>Customs &amp; Import Duties:</strong> International orders may be subject to customs duties, taxes, or import fees levied by the destination country. These charges are the sole responsibility of the recipient and are not included in our shipping fees. We recommend checking your country&apos;s import regulations before placing an order.
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          ORDER JOURNEY STEPS
      ══════════════════════════════════ */}
      <section style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Transparency</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Your Order Journey
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div className="ship-steps">
            {[
              { step: "01", icon: "🛍️", title: "Order Placed", desc: "Your order is confirmed and payment verified" },
              { step: "02", icon: "🔍", title: "Quality Check", desc: "Every item inspected by our QC team" },
              { step: "03", icon: "📦", title: "Packed & Sealed", desc: "Gift-wrapped in signature Bespokewala packaging" },
              { step: "04", icon: "🚚", title: "Dispatched", desc: "Shipped with tracking via Blue Dart / Delhivery / FedEx" },
              { step: "05", icon: "🏠", title: "Delivered", desc: "Safely delivered to your address" },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ padding: "0 0.5rem", position: "relative", zIndex: 1 }}>
                <div style={{
                  width: "46px", height: "46px",
                  borderRadius: "50%",
                  border: "2px solid #d2b48c",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.25rem",
                  margin: "0 auto 1rem",
                  backgroundColor: "#1c1c1c",
                }}>
                  {icon}
                </div>
                <p style={{ fontSize: "0.6rem", color: "#d2b48c", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Step {step}
                </p>
                <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#fff", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {title}
                </p>
                <p style={{ fontSize: "0.8rem", color: "#aaa", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#888", marginTop: "3rem" }}>
            ✦ &nbsp; Orders are processed within <strong style={{ color: "#d2b48c" }}>1–2 business days</strong>. Custom &amp; bespoke orders may require additional processing time of <strong style={{ color: "#d2b48c" }}>7–21 days</strong>.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════
          RETURNS & EXCHANGES
      ══════════════════════════════════ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Hassle-free</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Returns &amp; Exchanges
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div className="ship-two-col">
            {/* Policy details */}
            <div>
              {[
                {
                  icon: "↩️",
                  title: "Easy 7-Day Returns",
                  body: "You may return any ready-to-wear item within 7 days of delivery, provided it is unused, unwashed, with all original tags intact and in its original packaging. A return request must be initiated within 7 days of receiving the order.",
                },
                {
                  icon: "🔄",
                  title: "Exchanges — 14 Days",
                  body: "We offer size or colour exchanges within 14 days of delivery. If the desired size or colour is unavailable, a store credit of equal value will be issued, valid for 6 months from the date of issue.",
                },
                {
                  icon: "💰",
                  title: "Refund Processing",
                  body: "Approved refunds are processed to your original payment method within 7–10 business days after we receive and inspect the return. Store credits are issued within 24 hours of return approval.",
                },
                {
                  icon: "🚫",
                  title: "Non-Returnable Items",
                  body: "Custom / bespoke orders, altered garments, jewellery (for hygiene reasons), sale items marked 'Final Sale', and items returned after 7 days are not eligible for return or refund.",
                },
              ].map(({ icon, title, body }) => (
                <div key={title} className="policy-row">
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.25rem", flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
                    <div>
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1c1c1c", marginBottom: "0.5rem" }}>
                        {title}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.8 }}>{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* How to return */}
            <div style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "2.5rem" }}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Step-by-Step</p>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "2rem" }}>
                How to Initiate a Return
              </h3>
              {[
                { num: "1", text: "Email us at bespokewala@gmail.com with your order number and reason for return within 7 days." },
                { num: "2", text: "Our team will review and send a Return Authorisation (RA) number within 24 hours." },
                { num: "3", text: "Pack the item securely in its original packaging with all tags attached. Write the RA number on the parcel." },
                { num: "4", text: "Ship the package to our Mumbai address. We recommend using a tracked courier." },
                { num: "5", text: "Once received and quality-checked (2–3 business days), your refund or exchange is processed." },
              ].map(({ num, text }) => (
                <div key={num} style={{ display: "flex", gap: "1.25rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "32px", height: "32px", flexShrink: 0,
                    borderRadius: "50%",
                    border: "1px solid #d2b48c",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 600, color: "#d2b48c",
                  }}>
                    {num}
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#ccc", lineHeight: 1.7, paddingTop: "0.35rem" }}>{text}</p>
                </div>
              ))}

              <div style={{ borderTop: "1px solid #333", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
                <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.7 }}>
                  Return shipping costs are borne by the customer, except in cases of damaged, defective, or incorrect items — in which case we arrange a complimentary pickup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TRACK YOUR ORDER
      ══════════════════════════════════ */}
      <section style={{ backgroundColor: "#fff", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Real-Time Updates</p>
          <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c", marginBottom: "1rem" }}>
            Track Your Order
          </h2>
          <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "0 auto 1.5rem" }} />
          <p style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.8, marginBottom: "2rem" }}>
            Once your order is dispatched, you will receive an SMS and email with your tracking number. Use it to track your shipment directly on our courier partner&apos;s website.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { name: "Blue Dart", href: "https://www.bluedart.com" },
              { name: "Delhivery", href: "https://www.delhivery.com" },
              { name: "FedEx", href: "https://www.fedex.com" },
              { name: "DHL", href: "https://www.dhl.com" },
            ].map(({ name, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ fontSize: "0.75rem" }}
              >
                {name} →
              </a>
            ))}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "1.5rem" }}>
            Can&apos;t find your tracking number? Email us at&nbsp;
            <a href="mailto:bespokewala@gmail.com" style={{ color: "#d2b48c" }}>bespokewala@gmail.com</a>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════
          FAQ
      ══════════════════════════════════ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Common Questions</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Shipping FAQs
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          {[
            {
              q: "When will my order be dispatched?",
              a: "Ready-to-wear orders are dispatched within 1–2 business days. Custom or bespoke orders require 7–21 business days for creation before dispatch. You will receive a dispatch notification via SMS and email.",
            },
            {
              q: "Can I change my delivery address after placing an order?",
              a: "Address changes can be made within 2 hours of placing the order. Please email bespokewala@gmail.com immediately with your order number and the new address. After dispatch, we cannot change the delivery address.",
            },
            {
              q: "Do you ship to PO Box addresses?",
              a: "Unfortunately, we do not ship to PO Box addresses. Please provide a complete residential or commercial address with pin code for successful delivery.",
            },
            {
              q: "What happens if I'm not available at delivery time?",
              a: "Our courier partners will attempt delivery up to 3 times. After 3 failed attempts, the package will be returned to us. We will contact you to re-schedule delivery; however, re-shipping charges may apply.",
            },
            {
              q: "Is my order insured during transit?",
              a: "Yes. All Bespokewala orders are fully insured for their purchase value during transit. In the unlikely event of loss or damage in transit, we will send a replacement or issue a full refund.",
            },
            {
              q: "How are the orders packaged?",
              a: "Every order is packaged in our signature Bespokewala gift box, wrapped in tissue paper with a wax seal, and placed in a protective outer shipping box. Gift messaging is available free of charge — just add a note at checkout.",
            },
            {
              q: "Do I have to pay customs duties on international orders?",
              a: "Import duties, taxes, and customs clearance fees vary by country and are the buyer's responsibility. We recommend checking with your local customs authority before ordering.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="faq-item">
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1c1c1c", marginBottom: "0.6rem", letterSpacing: "0.02em" }}>
                ✦ &nbsp; {q}
              </p>
              <p style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.8, paddingLeft: "1.5rem" }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA STRIP
      ══════════════════════════════════ */}
      <section style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "clamp(3rem,7vw,5rem) 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1rem" }}>Still Have Questions?</p>
        <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
          We&apos;re Here to Help
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#aaa", maxWidth: "420px", margin: "0 auto 2rem", lineHeight: 1.8 }}>
          Reach our team on WhatsApp, email, or visit our Mumbai studio for any shipping or returns query.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/contact" className="btn-primary">Contact Us</Link>
          <a
            href="https://wa.me/917506767452?text=Hello%20Bespokewala%2C%20I%20have%20a%20shipping%20query."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ color: "#fff", borderColor: "#fff" }}
          >
            WhatsApp Us
          </a>
        </div>
      </section>
    </>
  );
}
