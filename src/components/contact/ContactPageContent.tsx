"use client";

import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   HYDRATION-SAFE APPROACH
   • No useState for animation visibility — use CSS @keyframes
     triggered by a data-attribute set after mount.
   • No useState for hover — use pure CSS :hover via a <style> block.
   • No <a> nesting — each ContactCard is a single <a> tag containing
     only non-interactive elements (span, div, p).
──────────────────────────────────────────────────────────────── */

const INFO = {
  email:            "info@bespokewala.com",
  phone:            "+91 75067 67452",
  whatsapp:         "917506767452",
  whatsappDisplay:  "+91 75067 67452",
  instagram:        "https://www.instagram.com/bespokewala?igsh=Y3Zud3V3OHd6OTIz",
  instagramHandle:  "@bespokewala",
  address: {
    line1: "Lotus Arc One (Arc One) Building",
    line2: "Monginis Lane, Off New Link Road",
    line3: "Andheri West, Mumbai",
    line4: "Maharashtra – 400053",
  },
};

/* ─── SVG icons ─── */
const IconEmail = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polyline points="2,4 12,13 22,4"/>
  </svg>
);
const IconPhone = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IconLocation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

/*
  ContactCard — a SINGLE <a> tag, no nested anchors, no JS hover state.
  Hover effects are handled entirely in CSS via the .contact-card class.
*/
function ContactCard({
  id, icon, label, line1, line2, href, delay = "0s",
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  line1: string;
  line2?: string;
  href: string;
  delay?: string;
}) {
  return (
    <a
      id={id}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="contact-card"
      style={{ animationDelay: delay }}
    >
      <span className="contact-card-icon">{icon}</span>
      <div style={{ minWidth: 0 }}>
        <p className="contact-card-label">{label}</p>
        <span className="contact-card-line1">{line1}</span>
        {line2 && <span className="contact-card-line2">{line2}</span>}
      </div>
    </a>
  );
}

/* ─── Main component ─── */
export default function ContactPageContent() {
  /* Track mount so the form submit handler can use window safely */
  const [mounted, setMounted] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mounted) return;
    const body    = encodeURIComponent(`Name: ${formState.name}\nEmail: ${formState.email}\n\n${formState.message}`);
    const subject = encodeURIComponent(formState.subject || "Enquiry from Website");
    window.location.href = `mailto:${INFO.email}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <>
      {/* ── ALL CSS IN ONE <style> BLOCK — no JS hover state needed ── */}
      <style>{`
        /* ── Contact card animations ── */
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .contact-card {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          padding: 1.75rem;
          background: #fff;
          border-bottom: 3px solid transparent;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
          animation: cardFadeUp 0.6s ease both;
        }
        .contact-card:hover {
          border-bottom-color: #d2b48c;
          box-shadow: 0 8px 28px rgba(0,0,0,0.07);
          transform: translateY(-3px);
        }
        #card-whatsapp:hover { border-bottom-color: #25D366; }
        #card-instagram:hover { border-bottom-color: #C13584; }

        .contact-card-icon  { color: #d2b48c; flex-shrink: 0; padding-top: 2px; }
        #card-whatsapp  .contact-card-icon { color: #25D366; }
        #card-instagram .contact-card-icon { color: #C13584; }

        .contact-card-label {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 0.4rem;
        }
        .contact-card-line1 {
          font-size: 0.875rem;
          color: #1c1c1c;
          font-weight: 400;
          display: block;
          word-break: break-all;
        }
        .contact-card-line2 {
          font-size: 0.75rem;
          color: #d2b48c;
          letter-spacing: 0.05em;
          display: block;
          margin-top: 0.2rem;
        }
        #card-whatsapp  .contact-card-line2 { color: #25D366; }
        #card-instagram .contact-card-line2 { color: #C13584; }

        /* ── Scroll-reveal for sections ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0);     }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        .reveal-up    { animation: fadeUp    0.8s ease both; }
        .reveal-left  { animation: fadeLeft  0.8s ease both; }
        .reveal-right { animation: fadeRight 0.8s ease 0.15s both; }

        /* ── Form ── */
        .contact-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #e0d8ce;
          background: #fff;
          font-family: var(--font-josefin-sans), sans-serif;
          font-size: 0.875rem;
          color: #1c1c1c;
          letter-spacing: 0.03em;
          outline: none;
          transition: border-color 0.25s ease;
          -webkit-appearance: none;
          border-radius: 0;
        }
        .contact-input:focus  { border-color: #d2b48c; }
        .contact-input::placeholder { color: #aaa; }
        .contact-textarea { resize: vertical; min-height: 140px; }

        /* ── Social icon buttons ── */
        .social-btn {
          width: 42px; height: 42px;
          border-radius: 50%;
          border: 1px solid #e8e0d6;
          display: flex; align-items: center; justify-content: center;
          color: #1c1c1c;
          transition: background-color 0.3s, color 0.3s, border-color 0.3s;
          text-decoration: none;
          flex-shrink: 0;
        }
        .social-btn-instagram:hover { background: #C13584; color: #fff; border-color: #C13584; }
        .social-btn-whatsapp:hover  { background: #25D366; color: #fff; border-color: #25D366; }

        /* ── Responsive layout ── */
        .contact-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        .contact-body-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 4rem;
          align-items: start;
        }
        .contact-name-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .info-strip-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          text-align: center;
        }
        @media (max-width: 960px) {
          .contact-cards-grid    { grid-template-columns: repeat(2, 1fr); }
          .contact-body-grid     { grid-template-columns: 1fr; gap: 2.5rem; }
          .info-strip-grid       { grid-template-columns: 1fr; text-align: left; gap: 1.5rem; }
        }
        @media (max-width: 540px) {
          .contact-cards-grid    { grid-template-columns: 1fr; }
          .contact-name-row      { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(135deg, #1c1c1c 0%, #2d2520 60%, #3d352e 100%)",
        color: "#fff",
        padding: "clamp(7rem,15vw,10rem) 1.5rem clamp(3rem,8vw,6rem)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.25rem" }}>
          We&apos;d Love to Hear From You
        </p>
        <h1 style={{ fontSize: "clamp(2rem,8vw,4rem)", fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Contact Us
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.5rem" }} />
        <p style={{ fontSize: "clamp(0.85rem,2vw,0.975rem)", fontWeight: 300, maxWidth: "500px", margin: "0 auto", lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
          Visit our Mumbai atelier, send us an email, or reach out on WhatsApp — our team is always happy to assist.
        </p>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3rem,8vw,5rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="contact-cards-grid">
            <ContactCard id="card-email"     icon={<IconEmail />}     label="Email Us"  line1={INFO.email}            line2="Send us a message →"  href={`mailto:${INFO.email}`}                                                                        delay="0s"    />
            <ContactCard id="card-phone"     icon={<IconPhone />}     label="Call Us"   line1={INFO.phone}            line2="Tap to call →"        href="tel:+917506767452"                                                                              delay="0.1s"  />
            <ContactCard id="card-whatsapp"  icon={<IconWhatsApp />}  label="WhatsApp"  line1={INFO.whatsappDisplay}  line2="Chat with us →"       href={`https://wa.me/${INFO.whatsapp}?text=Hello%20Bespokewala%2C%20I%20have%20an%20enquiry.`}         delay="0.2s"  />
            <ContactCard id="card-instagram" icon={<IconInstagram />} label="Instagram" line1={INFO.instagramHandle}  line2="Follow us →"          href={INFO.instagram}                                                                                 delay="0.3s"  />
          </div>
        </div>
      </section>

      {/* ── ADDRESS + MAP  |  FORM ── */}
      <section style={{ backgroundColor: "#fff", padding: "clamp(3rem,8vw,5rem) 1.5rem clamp(4rem,10vw,6rem)" }}>
        <div className="contact-body-grid" style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Left — Address & Map */}
          <div className="reveal-left">
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1rem" }}>Our Studio</p>
            <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.6rem)", fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem", color: "#1c1c1c" }}>
              Visit Us in Mumbai
            </h2>
            <div style={{ width: "50px", height: "1px", backgroundColor: "#d2b48c", marginBottom: "1.5rem" }} />

            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <span style={{ color: "#d2b48c", flexShrink: 0, paddingTop: "2px" }}><IconLocation /></span>
              <address style={{ fontStyle: "normal", fontSize: "0.9rem", lineHeight: 2, color: "#555" }}>
                {INFO.address.line1}<br />
                {INFO.address.line2}<br />
                {INFO.address.line3}<br />
                {INFO.address.line4}
              </address>
            </div>

            <a
              href="https://maps.google.com/?q=Lotus+Arc+One+Monginis+Lane+Andheri+West+Mumbai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ display: "inline-block", fontSize: "0.75rem", marginBottom: "2rem" }}
            >
              Get Directions
            </a>

            {/* Map */}
            <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", border: "1px solid #e8e0d6" }}>
              <iframe
                title="Bespokewala Studio Location"
                src="https://maps.google.com/maps?q=Lotus+Arc+One+Andheri+West+Mumbai&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Social row */}
            <div style={{ marginTop: "1.75rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Follow Us</p>
              <a href={INFO.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-btn social-btn-instagram">
                <IconInstagram />
              </a>
              <a href={`https://wa.me/${INFO.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-btn social-btn-whatsapp">
                <IconWhatsApp />
              </a>
            </div>
          </div>

          {/* Right — Form */}
          <div
            className="reveal-right"
            style={{ backgroundColor: "#faf9f7", padding: "clamp(1.5rem,5vw,3rem)", border: "1px solid #e8e0d6" }}
          >
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1rem" }}>Send a Message</p>
            <h2 style={{ fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem", color: "#1c1c1c" }}>
              Get in Touch
            </h2>
            <div style={{ width: "50px", height: "1px", backgroundColor: "#d2b48c", marginBottom: "2rem" }} />

            {submitted ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "1rem", color: "#d2b48c" }}>✦</span>
                <p style={{ fontSize: "1rem", color: "#1c1c1c", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Thank You!
                </p>
                <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.75rem", lineHeight: 1.7 }}>
                  Your email client should open shortly.<br />We&apos;ll reply within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="contact-name-row">
                  <div>
                    <label style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.5rem" }}>
                      Full Name *
                    </label>
                    <input className="contact-input" type="text" name="name" required placeholder="Your name" value={formState.name} onChange={handleChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.5rem" }}>
                      Email Address *
                    </label>
                    <input className="contact-input" type="email" name="email" required placeholder="your@email.com" value={formState.email} onChange={handleChange} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.5rem" }}>
                    Subject
                  </label>
                  <select className="contact-input" name="subject" value={formState.subject} onChange={handleChange}>
                    <option value="">Select a topic…</option>
                    <option value="Bridal Enquiry">Bridal Enquiry</option>
                    <option value="Custom Order">Custom / Bespoke Order</option>
                    <option value="Order Status">Order Status</option>
                    <option value="Styling Consultation">Styling Consultation</option>
                    <option value="Press & Media">Press &amp; Media</option>
                    <option value="General Enquiry">General Enquiry</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.5rem" }}>
                    Message *
                  </label>
                  <textarea className="contact-input contact-textarea" name="message" required placeholder="Tell us how we can help…" value={formState.message} onChange={handleChange} />
                </div>

                <p style={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.6, margin: '0.25rem 0' }}>
                  By submitting this form you agree that Bespokewala may use your information to respond to your enquiry. View our{' '}
                  <a href="/privacy-policy" style={{ color: '#d2b48c', textDecoration: 'underline' }}>Privacy Policy</a>.
                </p>
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── INFO STRIP ── */}
      <section style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "clamp(3rem,8vw,4rem) 1.5rem" }}>
        <div className="info-strip-grid" style={{ maxWidth: "900px", margin: "0 auto" }}>
          {[
            { label: "Studio Hours",   lines: ["Mon – Sat: 10am – 8pm", "Sunday: By Appointment"] },
            { label: "Response Time",  lines: ["Email: Within 24 hours", "WhatsApp: Within 2 hours"] },
            { label: "Appointments",   lines: ["Bridal consultations available", "Call or WhatsApp to book"] },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>{item.label}</p>
              {item.lines.map((line, j) => <p key={j} style={{ fontSize: "0.875rem", color: "#ccc", lineHeight: 2 }}>{line}</p>)}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
