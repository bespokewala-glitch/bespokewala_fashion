"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─────────────────────────── helpers ─────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─────────────────────────── sub-components ─────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "0.7rem",
      letterSpacing: "0.25em",
      textTransform: "uppercase",
      color: "#d2b48c",
      marginBottom: "1rem",
      fontWeight: 600,
    }}>
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div style={{
      width: "60px",
      height: "1px",
      backgroundColor: "#d2b48c",
      margin: "1.5rem 0",
    }} />
  );
}

/* ─────────────────────────── main component ─────────────────────────── */
export default function AboutPageContent() {

  /* Why Choose Us cards */
  const reasons = [
    {
      icon: "✦",
      title: "Master Craftsmanship",
      desc: "Every piece passes through the hands of artisans who have devoted decades to perfecting their craft — hand-embroidery, intricate zardozi, and heritage weaving techniques.",
    },
    {
      icon: "◈",
      title: "Rare, Curated Fabrics",
      desc: "We source the world's finest textiles — Benarasi silk, French chiffon, Japanese organza — ensuring each garment carries an unmistakable depth of luxury.",
    },
    {
      icon: "◇",
      title: "Bespoke Personalisation",
      desc: "No two clients are alike. Our atelier offers fully bespoke fittings, custom embroideries, and personal styling consultations for every occasion.",
    },
    {
      icon: "❋",
      title: "Commitment to Craft",
      desc: "We partner with dedicated weavers and support India's traditional textile communities, ensuring our craft honors the heritage of handmade fashion.",
    },
    {
      icon: "◉",
      title: "Bridal Heritage",
      desc: "Trusted by discerning brides for over two decades, our heritage of bespoke tailoring and attention to detail speaks to the calibre of our craft.",
    },
    {
      icon: "✧",
      title: "Global Reach, Intimate Service",
      desc: "With our Mumbai studio and delivery worldwide, every customer receives the same white-glove service regardless of where they are.",
    },
  ];

  /* Team */
  const team = [
    { name: "Hemali Patil", role: "Head Designer & CMO", initial: "H", image: "/Hemali%20Patil.jpeg" },
    { name: "Hemkumar Jayant", role: "Head Designer", initial: "H", image: "/Hemkumar%20Jayant.jpeg" },
    { name: "Manish Verma", role: "Chief Technology Officer", initial: "M", image: "/Manish%20Verma.jpeg" },
    { name: "Savitri Verma", role: "Head of Ecommerce", initial: "S", image: "/Savitri%20Verma.jpeg" },
  ];

  /* ── HERO ── */
  const heroSection = (
    <section style={{ position: "relative", height: "85vh", overflow: "hidden" }}>
      <img
        src="/about-hero.png"
        alt="Bespokewala atelier interior"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      {/* overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        color: "#fff", textAlign: "center", padding: "2rem",
      }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.25rem" }}>
          Established 2002 · Incorporated 2018 · Mumbai, India
        </p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          The Art of<br />Bespokewala
        </h1>
        <p style={{ fontSize: "1rem", fontWeight: 300, maxWidth: "560px", lineHeight: 1.8, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em" }}>
          Where timeless Indian heritage meets contemporary luxury — crafted for those who refuse to be ordinary.
        </p>
      </div>
    </section>
  );

  /* ── MISSION & VISION ── */
  const missionRef = useInView();
  const visionRef  = useInView();

  const missionVision = (
    <section className="about-section-m-v" style={{ backgroundColor: "#faf9f7", padding: "7rem 2rem" }}>
      <div className="about-grid-2" style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>

        {/* Mission */}
        <div
          ref={missionRef.ref}
          style={{
            opacity: missionRef.visible ? 1 : 0,
            transform: missionRef.visible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <SectionLabel>Our Mission</SectionLabel>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "0" }}>
            Redefining Indian<br />Luxury Fashion
          </h2>
          <Divider />
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#555", marginBottom: "1.25rem" }}>
            Our mission is to celebrate the richness of India's textile heritage and present it to the world in a language that is modern, wearable, and deeply personal. We believe that true luxury is not just about price — it is about the story woven into every thread, the skill embedded in every stitch.
          </p>
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#555" }}>
            We exist to dress individuals who seek more than clothing — people who seek identity, artistry, and an experience that begins long before the garment is worn.
          </p>
        </div>

        {/* Vision */}
        <div
          ref={visionRef.ref}
          className="about-vision"
          style={{
            opacity: visionRef.visible ? 1 : 0,
            transform: visionRef.visible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
            paddingTop: "3rem",
            borderLeft: "1px solid #e8e0d6",
            paddingLeft: "4rem",
          }}
        >
          <SectionLabel>Our Vision</SectionLabel>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "0" }}>
            A Global Icon<br />Rooted in India
          </h2>
          <Divider />
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#555", marginBottom: "1.25rem" }}>
            We envision Bespokewala as the world's most celebrated Indian luxury fashion house — a name synonymous with impeccable craft, enduring elegance, and cultural pride on every global stage.
          </p>
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#555" }}>
            From bridal couture to everyday luxury, our vision is a wardrobe where every piece tells a story worth passing down through generations.
          </p>
        </div>

      </div>
    </section>
  );

  /* ── HOW WE STARTED ── */
  const storyRef = useInView(0.1);
  const howWeStarted = (
    <section className="about-section-m-v" style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "7rem 2rem", overflow: "hidden" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

        {/* Text */}
        <div
          ref={storyRef.ref}
          style={{
            opacity: storyRef.visible ? 1 : 0,
            transform: storyRef.visible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.9s ease, transform 0.9s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <SectionLabel>Our Story</SectionLabel>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.25, color: "#fff", marginBottom: "0" }}>
            From a Single Studio<br />to a Fashion Legacy
          </h2>
          <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "1.5rem auto" }} />
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#ccc", marginBottom: "1.25rem" }}>
            Bespokewala began its journey in 2002 with a passion for craftsmanship, bespoke fashion, and timeless Indian luxury. Over the years, the brand has built its experience in creating personalized and premium fashion for its customers.
          </p>
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#ccc", marginBottom: "1.25rem" }}>
            In 2018, the business was formally incorporated as a company, marking the next chapter in its growth and expansion.
          </p>
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#ccc" }}>
            Today, Bespokewala combines years of craftsmanship and experience with modern design, manufacturing, retail, and a growing digital presence.
          </p>
        </div>

      </div>
    </section>
  );

  /* ── OWNER'S MESSAGE ── */
  const ownerRef = useInView(0.1);
  const ownerMessage = (
    <section className="about-section-m-v" style={{ backgroundColor: "#faf9f7", padding: "7rem 2rem" }}>
      <div className="about-grid-owner" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "5rem", alignItems: "center" }}>

        {/* Portrait */}
        <div style={{ position: "relative" }}>
          <img
            src="/about-hero.png"
            alt="Founder of Bespokewala"
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
          />
          {/* decorative frame */}
          <div style={{
            position: "absolute", top: "1.5rem", left: "1.5rem", right: "-1.5rem", bottom: "-1.5rem",
            border: "1px solid #d2b48c", zIndex: -1,
          }} />
        </div>

        {/* Message */}
        <div
          ref={ownerRef.ref}
          style={{
            opacity: ownerRef.visible ? 1 : 0,
            transform: ownerRef.visible ? "translateX(0)" : "translateX(40px)",
            transition: "opacity 0.9s ease, transform 0.9s ease",
          }}
        >
          <SectionLabel>A Message from Our Founder</SectionLabel>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.3, marginBottom: "0" }}>
            Fashion is the<br />most intimate art form
          </h2>
          <Divider />

          <blockquote style={{ borderLeft: "3px solid #d2b48c", paddingLeft: "1.5rem", margin: "1.5rem 0 2rem" }}>
            <p style={{ fontSize: "1.1rem", fontStyle: "italic", lineHeight: 1.9, color: "#555", fontWeight: 300 }}>
              "I started Bespokewala not to sell clothes, but to give people an emotion they could wear — pride, beauty, confidence, and a deep connection to the traditions that make India extraordinary."
            </p>
          </blockquote>

          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#666", marginBottom: "1.25rem" }}>
            When I look back at the journey, I don't see a business — I see thousands of moments: a bride's eyes lighting up, a performer stepping onto the stage, a person discovering their most powerful self in something we made just for them.
          </p>
          <p style={{ fontSize: "0.975rem", lineHeight: 1.9, color: "#666", marginBottom: "2rem" }}>
            Every collection we create is a love letter to Indian craft, and every piece we deliver is a promise that luxury can be soulful, sustainable, and deeply human.
          </p>

          <div>
            <p style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Imran Shaikh
            </p>
            <p style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#d2b48c", marginTop: "0.25rem" }}>
              Founder & Managing Director
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  /* ── WHY CHOOSE US ── */
  const whyRef = useInView(0.05);
  const whyChooseUs = (
    <section className="about-section-m-v" style={{ backgroundColor: "#fff", padding: "7rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* heading */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <SectionLabel>Why Bespokewala</SectionLabel>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            The Bespokewala Difference
          </h2>
          <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "1.5rem auto 0" }} />
        </div>

        {/* cards grid */}
        <div
          ref={whyRef.ref}
          className="about-grid-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2px",
            backgroundColor: "#e8e0d6",
            opacity: whyRef.visible ? 1 : 0,
            transform: whyRef.visible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          {reasons.map((r, i) => (
            <div
              key={i}
              className="why-card"
              style={{
                backgroundColor: "#fff",
                padding: "3rem 2.5rem",
                transition: "background-color 0.3s ease, transform 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = "#1c1c1c";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                const icon = e.currentTarget.querySelector(".why-icon") as HTMLElement;
                const title = e.currentTarget.querySelector(".why-title") as HTMLElement;
                const desc = e.currentTarget.querySelector(".why-desc") as HTMLElement;
                if (icon) icon.style.color = "#d2b48c";
                if (title) title.style.color = "#fff";
                if (desc) desc.style.color = "#aaa";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = "#fff";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                const icon = e.currentTarget.querySelector(".why-icon") as HTMLElement;
                const title = e.currentTarget.querySelector(".why-title") as HTMLElement;
                const desc = e.currentTarget.querySelector(".why-desc") as HTMLElement;
                if (icon) icon.style.color = "#d2b48c";
                if (title) title.style.color = "#1c1c1c";
                if (desc) desc.style.color = "#666";
              }}
            >
              <span className="why-icon" style={{ fontSize: "1.75rem", color: "#d2b48c", display: "block", marginBottom: "1.25rem", transition: "color 0.3s" }}>
                {r.icon}
              </span>
              <h3 className="why-title" style={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", color: "#1c1c1c", transition: "color 0.3s" }}>
                {r.title}
              </h3>
              <p className="why-desc" style={{ fontSize: "0.875rem", lineHeight: 1.8, color: "#666", transition: "color 0.3s" }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ── TEAM ── */
  const teamRef = useInView(0.1);
  const teamSection = (
    <section className="about-section-m-v" style={{ backgroundColor: "#faf9f7", padding: "7rem 2rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <SectionLabel>The People Behind the Label</SectionLabel>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Meet Our Team
          </h2>
          <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "1.5rem auto 0" }} />
        </div>

        <div
          ref={teamRef.ref}
          className="about-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "2rem",
            opacity: teamRef.visible ? 1 : 0,
            transform: teamRef.visible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          {team.map((member, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              {/* Avatar placeholder or Image */}
              <div style={{
                width: "100%",
                aspectRatio: "1",
                backgroundColor: "#e8e0d6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                fontWeight: 300,
                color: "#9e836a",
                letterSpacing: "0.05em",
                marginBottom: "1.25rem",
                transition: "background-color 0.3s",
                overflow: "hidden",
                position: "relative"
              }}>
                {member.image ? (
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                ) : (
                  member.initial
                )}
              </div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1c1c1c", marginBottom: "0.35rem" }}>
                {member.name}
              </p>
              <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#d2b48c" }}>
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ── CTA STRIP ── */
  const ctaStrip = (
    <section className="about-section-m-v" style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "5rem 2rem", textAlign: "center" }}>
      <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.25rem" }}>
        Experience Bespokewala
      </p>
      <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
        Ready to Wear a Masterpiece?
      </h2>
      <p style={{ fontSize: "0.975rem", color: "#aaa", maxWidth: "480px", margin: "0 auto 2.5rem", lineHeight: 1.8 }}>
        Explore our latest collections or book a personal styling consultation at our Mumbai studio.
      </p>
      <div className="cta-buttons" style={{ display: 'flex', justifyContent: 'center', marginBottom: "2.5rem" }}>
        <Link href="/products/couture" className="btn-primary" style={{ marginRight: "1rem" }}>
          Discover Couture
        </Link>
        <Link href="/consultation" className="btn-secondary" style={{ color: "#fff", borderColor: "#fff" }}>
          Request an Appointment
        </Link>
      </div>

      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.6 }}>
        <strong>General Enquiries:</strong> <a href="mailto:info@bespokewala.com" style={{ color: "#d2b48c", textDecoration: "underline" }}>info@bespokewala.com</a><br/>
        <strong>Sales &amp; Product Enquiries:</strong> <a href="mailto:sales@bespokewala.com" style={{ color: "#d2b48c", textDecoration: "underline" }}>sales@bespokewala.com</a>
      </p>
    </section>
  );

  return (
    <div style={{ overflowX: "hidden", maxWidth: "100%" }}>
      <style>{`
        @media (max-width: 992px) {
          .about-grid-2, .about-grid-owner {
            gap: 3rem !important;
          }
          .about-grid-3 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .about-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .about-vision {
            padding-left: 2rem !important;
          }
        }
        
        @media (max-width: 768px) {
          .about-grid-2, .about-grid-owner {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
          .about-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .about-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
          }
          .about-vision {
            padding-top: 2.5rem !important;
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid #e8e0d6 !important;
            margin-top: 0.5rem !important;
          }
          .about-section-m-v {
            padding: 4rem 1.5rem !important;
          }
          .cta-buttons {
            flex-direction: column !important;
            align-items: center !important;
            gap: 1rem !important;
          }
          .cta-buttons a {
            margin-right: 0 !important;
            width: 100% !important;
            max-width: 300px !important;
            display: flex !important;
            justify-content: center !important;
          }
        }
      `}</style>
      {heroSection}
      {missionVision}
      {howWeStarted}
      {ownerMessage}
      {whyChooseUs}
      {teamSection}
      {ctaStrip}
    </div>
  );
}
