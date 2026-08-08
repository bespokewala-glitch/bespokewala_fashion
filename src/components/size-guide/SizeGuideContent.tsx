/* Pure server component — zero useState/useEffect, zero hydration risk.
   Tab switching uses the native <details> pattern + CSS :target for no-JS tabs. */

import React from 'react';
import Link from 'next/link';

export default function SizeGuideContent() {
  return (
    <>
      <style>{`
        /* ── animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sg-fade { animation: fadeUp 0.65s ease both; }

        /* ── how-to-measure cards ── */
        .measure-card {
          background: #fff;
          border: 1px solid #e8e0d6;
          padding: 1.75rem 1.5rem;
          text-align: center;
          transition: box-shadow 0.3s, transform 0.3s, border-color 0.3s;
        }
        .measure-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.07);
          transform: translateY(-4px);
          border-bottom-color: #d2b48c;
        }

        /* ── size tables ── */
        .sg-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
        .sg-table th {
          background: #1c1c1c;
          color: #d2b48c;
          padding: 0.8rem 1rem;
          text-align: center;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 500;
          white-space: nowrap;
        }
        .sg-table th:first-child { text-align: left; }
        .sg-table td {
          padding: 0.8rem 1rem;
          text-align: center;
          color: #444;
          border-bottom: 1px solid #f0ebe4;
          line-height: 1.5;
        }
        .sg-table td:first-child { text-align: left; font-weight: 500; color: #1c1c1c; }
        .sg-table tr:nth-child(even) td { background: #faf9f7; }
        .sg-table tr:last-child td { border-bottom: none; }
        .sg-table tr:hover td { background: #fdf5e8; }

        /* ── highlight "recommended" row ── */
        .sg-table tr.sg-row-highlight td {
          background: #fffbf0;
          border-left: 3px solid #d2b48c;
        }

        /* ── category tab nav ── */
        .sg-tab-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2.5rem;
        }
        .sg-tab-btn {
          padding: 0.55rem 1.4rem;
          border: 1px solid #e8e0d6;
          background: #fff;
          font-family: var(--font-josefin-sans), sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #555;
          text-decoration: none;
          transition: background 0.25s, color 0.25s, border-color 0.25s;
          cursor: pointer;
        }
        .sg-tab-btn:hover,
        .sg-tab-btn.active {
          background: #1c1c1c;
          color: #d2b48c;
          border-color: #1c1c1c;
        }

        /* ── section cards ── */
        .sg-section {
          background: #fff;
          border: 1px solid #e8e0d6;
          padding: 2rem;
          margin-bottom: 2rem;
          overflow-x: auto;
        }
        .sg-section-title {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #d2b48c;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sg-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e8e0d6;
        }

        /* ── tip box ── */
        .sg-tip {
          background: linear-gradient(135deg, #faf3e8 0%, #fdf8f0 100%);
          border: 1px solid #e8d9bc;
          border-left: 4px solid #d2b48c;
          padding: 1.1rem 1.4rem;
          font-size: 0.85rem;
          color: #5a4a30;
          line-height: 1.75;
          margin-bottom: 1.25rem;
        }

        /* ── measure grid ── */
        .measure-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 3.5rem;
        }

        /* ── two-col layout ── */
        .sg-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        /* ── unit toggle notice ── */
        .unit-notice {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f4f0eb;
          border: 1px solid #e8e0d6;
          padding: 0.4rem 1rem;
          font-size: 0.72rem;
          color: #888;
          letter-spacing: 0.08em;
          margin-bottom: 1.5rem;
        }

        /* ── responsive ── */
        @media (max-width: 900px) {
          .measure-grid  { grid-template-columns: repeat(2, 1fr); }
          .sg-two-col    { grid-template-columns: 1fr; }
        }
        @media (max-width: 540px) {
          .measure-grid  { grid-template-columns: 1fr 1fr; }
          .sg-section    { padding: 1.25rem 0.75rem; }
        }
      `}</style>

      {/* ══ HERO ══ */}
      <section style={{
        background: "linear-gradient(135deg, #1c1c1c 0%, #2d2520 60%, #3d352e 100%)",
        color: "#fff",
        padding: "clamp(7rem,15vw,10rem) 1.5rem clamp(3rem,8vw,5.5rem)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.25rem" }}>
          Perfect Fit, Every Time
        </p>
        <h1 style={{ fontSize: "clamp(2rem,7vw,3.75rem)", fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Size Guide
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.5rem" }} />
        <p style={{ fontSize: "clamp(0.85rem,2vw,0.95rem)", fontWeight: 300, maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, color: "rgba(255,255,255,0.72)" }}>
          Use our detailed size charts to find your ideal fit. When in doubt, we recommend choosing a larger size
          — or contact us for a complimentary styling consultation.
        </p>
      </section>

      {/* ══ HOW TO MEASURE ══ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Step 1</p>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              How to Take Your Measurements
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div className="sg-tip">
            💡 <strong>Tip:</strong> Use a soft measuring tape. Wear your lightest innerwear when measuring. Stand straight with feet together. For the most accurate results, ask someone to help you measure.
          </div>

          <div className="measure-grid">
            {[
              { icon: "📏", label: "Bust / Chest", desc: "Measure around the fullest part of your chest / bust, keeping the tape parallel to the ground." },
              { icon: "〰️", label: "Waist",        desc: "Measure around the narrowest part of your natural waist, usually about 2.5 cm above the navel." },
              { icon: "🔵", label: "Hip",          desc: "Stand with feet together. Measure around the fullest part of your hips, about 20 cm below the waist." },
              { icon: "📐", label: "Shoulder",     desc: "Measure across the back from one shoulder tip to the other, keeping the tape flat against your back." },
              { icon: "📋", label: "Sleeve Length",desc: "From the top of the shoulder to the wrist with arm slightly bent." },
              { icon: "🦵", label: "Inseam",       desc: "From the crotch to the bottom of the leg, measured on the inside of the thigh." },
              { icon: "📊", label: "Length",       desc: "For kurtis / tops: from the highest point of the shoulder to the desired hem length." },
              { icon: "🎗️", label: "Blouse Back",  desc: "From the nape of the neck down to the waist, measured along the spine." },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="measure-card sg-fade">
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{icon}</div>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1c1c1c", marginBottom: "0.6rem" }}>{label}</p>
                <p style={{ fontSize: "0.8rem", color: "#666", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WOMEN'S SIZE CHARTS ══ */}
      <section style={{ backgroundColor: "#fff", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Women</p>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Women&apos;s Size Charts
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <p className="unit-notice">📐 All measurements in centimetres (cm) &nbsp;|&nbsp; 1 inch = 2.54 cm</p>

          {/* Lehenga / Anarkali / Gown */}
          <div className="sg-section">
            <div className="sg-section-title">Lehenga, Anarkali &amp; Gown</div>
            <div style={{ overflowX: "auto" }}>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Bust (cm)</th>
                    <th>Waist (cm)</th>
                    <th>Hip (cm)</th>
                    <th>Lehenga Length (cm)</th>
                    <th>Fits Body Weight (approx.)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["XS",  "76–80",   "60–64",   "84–88",   "38–40",  "40–48 kg"],
                    ["S",   "80–84",   "64–68",   "88–92",   "40–42",  "48–54 kg"],
                    ["M",   "84–88",   "68–72",   "92–96",   "40–42",  "54–62 kg"],
                    ["L",   "88–92",   "72–76",   "96–100",  "40–42",  "62–70 kg"],
                    ["XL",  "92–96",   "76–80",   "100–104", "40–42",  "70–78 kg"],
                    ["XXL", "96–102",  "80–86",   "104–110", "40–42",  "78–88 kg"],
                    ["3XL", "102–108", "86–92",   "110–116", "40–44",  "88–98 kg"],
                  ].map(([size, bust, waist, hip, len, wt]) => (
                    <tr key={size}>
                      <td>{size}</td><td>{bust}</td><td>{waist}</td><td>{hip}</td><td>{len}</td><td>{wt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.75rem" }}>* Lehenga length is from the waist to floor. Custom length available at no extra charge.</p>
          </div>

          {/* Blouse / Choli */}
          <div className="sg-section">
            <div className="sg-section-title">Saree Blouse &amp; Choli</div>
            <div style={{ overflowX: "auto" }}>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Bust (cm)</th>
                    <th>Waist (cm)</th>
                    <th>Shoulder (cm)</th>
                    <th>Back Length (cm)</th>
                    <th>Sleeve Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["XS",  "76–80",   "60–64",  "34",  "14–15",  "12–14"],
                    ["S",   "80–84",   "64–68",  "35",  "14–15",  "12–14"],
                    ["M",   "84–88",   "68–72",  "36",  "15–16",  "14–16"],
                    ["L",   "88–92",   "72–76",  "37",  "15–16",  "14–16"],
                    ["XL",  "92–96",   "76–80",  "38",  "15–16",  "16–18"],
                    ["XXL", "96–102",  "80–86",  "39",  "15–16",  "16–18"],
                    ["3XL", "102–108", "86–92",  "40",  "16–17",  "16–18"],
                  ].map(([size, bust, waist, sho, bkl, slv]) => (
                    <tr key={size}>
                      <td>{size}</td><td>{bust}</td><td>{waist}</td><td>{sho}</td><td>{bkl}</td><td>{slv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.75rem" }}>* Blouse back length is from the nape of the neck to the waist.</p>
          </div>

          {/* Kurti / Kurta / Tunic */}
          <div className="sg-section">
            <div className="sg-section-title">Kurti, Kurta &amp; Tunic</div>
            <div style={{ overflowX: "auto" }}>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Bust (cm)</th>
                    <th>Waist (cm)</th>
                    <th>Hip (cm)</th>
                    <th>Shoulder (cm)</th>
                    <th>Kurti Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["XS",  "76–80",   "60–64",   "84–88",   "34",  "36–38"],
                    ["S",   "80–84",   "64–68",   "88–92",   "35",  "38–40"],
                    ["M",   "84–88",   "68–72",   "92–96",   "36",  "40–42"],
                    ["L",   "88–92",   "72–76",   "96–100",  "37",  "42–44"],
                    ["XL",  "92–96",   "76–80",   "100–104", "38",  "42–44"],
                    ["XXL", "96–102",  "80–86",   "104–110", "39",  "44–46"],
                    ["3XL", "102–108", "86–92",   "110–116", "40",  "44–46"],
                  ].map(([size, bust, waist, hip, sho, len]) => (
                    <tr key={size}>
                      <td>{size}</td><td>{bust}</td><td>{waist}</td><td>{hip}</td><td>{sho}</td><td>{len}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Salwar / Palazzo / Dhoti Pants */}
          <div className="sg-section">
            <div className="sg-section-title">Salwar, Palazzo &amp; Dhoti Pants</div>
            <div style={{ overflowX: "auto" }}>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Waist (cm)</th>
                    <th>Hip (cm)</th>
                    <th>Thigh (cm)</th>
                    <th>Inseam (cm)</th>
                    <th>Total Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["XS",  "60–64",  "84–88",   "48–50",  "68–70",  "96–98"],
                    ["S",   "64–68",  "88–92",   "50–52",  "70–72",  "98–100"],
                    ["M",   "68–72",  "92–96",   "52–54",  "72–74",  "100–102"],
                    ["L",   "72–76",  "96–100",  "54–56",  "74–76",  "100–102"],
                    ["XL",  "76–80",  "100–104", "56–58",  "74–76",  "100–102"],
                    ["XXL", "80–86",  "104–110", "58–62",  "74–76",  "100–102"],
                    ["3XL", "86–92",  "110–116", "62–66",  "74–76",  "100–102"],
                  ].map(([size, waist, hip, thigh, ins, len]) => (
                    <tr key={size}>
                      <td>{size}</td><td>{waist}</td><td>{hip}</td><td>{thigh}</td><td>{ins}</td><td>{len}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MEN'S SIZE CHARTS ══ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Men</p>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Men&apos;s Size Charts
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <p className="unit-notice">📐 All measurements in centimetres (cm) &nbsp;|&nbsp; 1 inch = 2.54 cm</p>

          {/* Sherwani / Achkan / Bandhgala */}
          <div className="sg-section">
            <div className="sg-section-title">Sherwani, Achkan &amp; Bandhgala</div>
            <div style={{ overflowX: "auto" }}>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (cm)</th>
                    <th>Waist (cm)</th>
                    <th>Shoulder (cm)</th>
                    <th>Sherwani Length (cm)</th>
                    <th>Sleeve Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["38 / S",   "92–96",   "78–82",  "42",  "48–50",  "60–62"],
                    ["40 / M",   "96–100",  "82–86",  "43",  "48–50",  "61–63"],
                    ["42 / L",   "100–104", "86–90",  "44",  "50–52",  "62–64"],
                    ["44 / XL",  "104–108", "90–94",  "45",  "50–52",  "63–65"],
                    ["46 / XXL", "108–112", "94–98",  "46",  "50–52",  "64–66"],
                    ["48 / 3XL", "112–118", "98–104", "47",  "52–54",  "65–67"],
                    ["50 / 4XL", "118–124", "104–110","48",  "52–54",  "65–67"],
                  ].map(([size, chest, waist, sho, len, slv]) => (
                    <tr key={size}>
                      <td>{size}</td><td>{chest}</td><td>{waist}</td><td>{sho}</td><td>{len}</td><td>{slv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.75rem" }}>* Sherwani length measured from shoulder to hem (typically knee to mid-calf).</p>
          </div>

          {/* Kurta / Nehru Jacket */}
          <div className="sg-section">
            <div className="sg-section-title">Kurta &amp; Nehru Jacket</div>
            <div style={{ overflowX: "auto" }}>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (cm)</th>
                    <th>Waist (cm)</th>
                    <th>Shoulder (cm)</th>
                    <th>Kurta Length (cm)</th>
                    <th>Sleeve Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["38 / S",   "90–94",   "76–80",  "42",  "42–44",  "60–62"],
                    ["40 / M",   "94–98",   "80–84",  "43",  "43–45",  "61–63"],
                    ["42 / L",   "98–102",  "84–88",  "44",  "44–46",  "62–64"],
                    ["44 / XL",  "102–106", "88–92",  "45",  "44–46",  "63–65"],
                    ["46 / XXL", "106–110", "92–96",  "46",  "44–46",  "64–66"],
                    ["48 / 3XL", "110–116", "96–102", "47",  "46–48",  "65–67"],
                    ["50 / 4XL", "116–122", "102–108","48",  "46–48",  "65–67"],
                  ].map(([size, chest, waist, sho, len, slv]) => (
                    <tr key={size}>
                      <td>{size}</td><td>{chest}</td><td>{waist}</td><td>{sho}</td><td>{len}</td><td>{slv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Churidar / Pyjama */}
          <div className="sg-section">
            <div className="sg-section-title">Churidar, Pyjama &amp; Dhoti</div>
            <div style={{ overflowX: "auto" }}>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Waist (cm)</th>
                    <th>Hip (cm)</th>
                    <th>Thigh (cm)</th>
                    <th>Inseam (cm)</th>
                    <th>Total Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["38 / S",   "74–78",   "88–92",   "52–54",  "74–76",  "100–102"],
                    ["40 / M",   "78–82",   "92–96",   "54–56",  "76–78",  "102–104"],
                    ["42 / L",   "82–86",   "96–100",  "56–58",  "76–78",  "102–104"],
                    ["44 / XL",  "86–90",   "100–104", "58–60",  "78–80",  "104–106"],
                    ["46 / XXL", "90–94",   "104–108", "60–62",  "78–80",  "104–106"],
                    ["48 / 3XL", "94–100",  "108–114", "62–66",  "78–80",  "104–106"],
                    ["50 / 4XL", "100–106", "114–120", "66–70",  "78–80",  "104–106"],
                  ].map(([size, waist, hip, thigh, ins, len]) => (
                    <tr key={size}>
                      <td>{size}</td><td>{waist}</td><td>{hip}</td><td>{thigh}</td><td>{ins}</td><td>{len}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ACCESSORIES & JEWELLERY ══ */}
      <section style={{ backgroundColor: "#fff", padding: "clamp(3rem,7vw,5rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Accessories</p>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Accessories &amp; Jewellery
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div className="sg-two-col">
            {/* Ring sizes */}
            <div className="sg-section" style={{ marginBottom: 0 }}>
              <div className="sg-section-title">Ring Sizes</div>
              <table className="sg-table">
                <thead>
                  <tr>
                    <th>Indian Size</th>
                    <th>US Size</th>
                    <th>Diameter (mm)</th>
                    <th>Circumference (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["6",  "3",    "14.1", "44.2"],
                    ["8",  "4",    "14.8", "46.5"],
                    ["10", "5",    "15.7", "49.3"],
                    ["12", "6",    "16.5", "51.8"],
                    ["14", "7",    "17.3", "54.4"],
                    ["16", "8",    "18.1", "56.9"],
                    ["18", "9",    "19.0", "59.7"],
                    ["20", "10",   "19.8", "62.1"],
                    ["22", "11",   "20.6", "64.6"],
                  ].map(([ind, us, dia, circ]) => (
                    <tr key={ind}>
                      <td>{ind}</td><td>{us}</td><td>{dia}</td><td>{circ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.75rem" }}>
                * To find your ring size, wrap a thin strip of paper around your finger, mark where it overlaps, and measure the length.
              </p>
            </div>

            {/* Dupatta / Stole / Bangle */}
            <div>
              <div className="sg-section">
                <div className="sg-section-title">Bangle Sizes</div>
                <table className="sg-table">
                  <thead>
                    <tr>
                      <th>Size Label</th>
                      <th>Inner Diameter (cm)</th>
                      <th>Fits Wrist (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["2/2",  "5.4",  "13.5–14.5"],
                      ["2/4",  "5.6",  "14.5–15.5"],
                      ["2/6",  "5.8",  "15.5–16.5"],
                      ["2/8",  "6.0",  "16.5–17.5"],
                      ["2/10", "6.3",  "17.5–18.5"],
                      ["2/12", "6.6",  "18.5–19.5"],
                    ].map(([sz, diam, wrist]) => (
                      <tr key={sz}><td>{sz}</td><td>{diam}</td><td>{wrist}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sg-section" style={{ marginTop: "1.5rem" }}>
                <div className="sg-section-title">Dupatta &amp; Stole</div>
                <table className="sg-table">
                  <thead>
                    <tr><th>Style</th><th>Width (cm)</th><th>Length (cm)</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ["Dupatta (Lehenga)",  "100–110", "240–260"],
                      ["Dupatta (Salwar)",   "95–105",  "220–240"],
                      ["Half Dupatta",       "50–55",   "220–240"],
                      ["Stole / Scarf",      "65–75",   "180–200"],
                      ["Chunri",             "100–110", "100–110"],
                    ].map(([style, w, l]) => (
                      <tr key={style}><td>{style}</td><td>{w}</td><td>{l}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONVERSION TABLE ══ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3rem,7vw,5rem) 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Reference</p>
            <h2 style={{ fontSize: "clamp(1.3rem,2.5vw,1.8rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              International Size Conversion
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="sg-table">
              <thead>
                <tr>
                  <th>Bespoken Size</th>
                  <th>India</th>
                  <th>US / Canada</th>
                  <th>UK</th>
                  <th>EU</th>
                  <th>Bust (cm)</th>
                  <th>Waist (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["XS",  "28–30", "0–2",   "4–6",   "32–34", "76–80",   "60–64"],
                  ["S",   "30–32", "2–4",   "6–8",   "34–36", "80–84",   "64–68"],
                  ["M",   "32–34", "6–8",   "10–12", "38–40", "84–88",   "68–72"],
                  ["L",   "34–36", "10–12", "14–16", "42–44", "88–92",   "72–76"],
                  ["XL",  "36–38", "14–16", "18–20", "46–48", "92–96",   "76–80"],
                  ["XXL", "38–40", "18–20", "22–24", "50–52", "96–102",  "80–86"],
                  ["3XL", "42–44", "20–22", "24–26", "54–56", "102–108", "86–92"],
                ].map(([bsp, ind, us, uk, eu, bust, waist]) => (
                  <tr key={bsp}>
                    <td><strong>{bsp}</strong></td><td>{ind}</td><td>{us}</td><td>{uk}</td><td>{eu}</td><td>{bust}</td><td>{waist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ FIT TIPS ══ */}
      <section style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "clamp(3.5rem,8vw,5.5rem) 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Expert Advice</p>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Fit Tips from Our Atelier
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: "👗", tip: "For lehengas and anarkalis, always prioritise the bust and waist measurements — the length and flare are easier to adjust." },
              { icon: "✂️", tip: "If you fall between two sizes, size up. It's always easier to take in a garment than to let it out." },
              { icon: "📏", tip: "For custom orders, provide all 8 measurements listed above. Our master tailors will craft the perfect fit from scratch." },
              { icon: "🔵", tip: "For blouses and cholis, the back measurement is critical. A snug shoulder is preferable — it can't be let out after stitching." },
              { icon: "🏃", tip: "Heavy embroidery and zari work can add 0.5–1 kg to a garment. Account for this when planning for extended wear." },
              { icon: "💌", tip: "Unsure? WhatsApp a photo of your measurements to +91 75067 67452 and our stylist will recommend the right size personally." },
            ].map(({ icon, tip }, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(210,180,140,0.2)", padding: "1.5rem" }}>
                <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "0.75rem" }}>{icon}</span>
                <p style={{ fontSize: "0.85rem", color: "#ccc", lineHeight: 1.8 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3rem,7vw,5rem) 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1rem" }}>
          Still Unsure?
        </p>
        <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c", marginBottom: "1rem" }}>
          Book a Free Styling Consultation
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#666", maxWidth: "460px", margin: "0 auto 2rem", lineHeight: 1.8 }}>
          Our in-house stylists are happy to guide you to the right size and silhouette — virtually or in-studio at our Mumbai atelier.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <a href="https://wa.me/917506767452?text=Hi%2C%20I%20need%20help%20with%20sizing." target="_blank" rel="noopener noreferrer" className="btn-primary">
            💬 WhatsApp for Sizing Help
          </a>
          <Link href="/contact" className="btn-secondary">Contact Our Atelier →</Link>
        </div>
      </section>
    </>
  );
}
