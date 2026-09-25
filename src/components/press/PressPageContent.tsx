/* Pure server component — no useState/useEffect, no hydration risk */
import Link from 'next/link';

const PRESS_COVERAGE = [
  {
    publication: "The Economic Times",
    logo: "THE ECONOMIC TIMES",
    title: "Achievers 2020 – Recognising and honouring achievers",
    year: "2020",
    category: "Business",
    url: "https://economictimes.indiatimes.com/magazines/panache/achievers-2020-recognising-and-honouring-achievers/articleshow/80442702.cms?from=mdr",
  },
  {
    publication: "Bollywood Hungama",
    logo: "BOLLYWOOD HUNGAMA",
    title: "Chitrangda Singh snapped inaugurating the Bespokewala store of Imran Shaikh",
    year: "2023",
    category: "Celebrity",
    url: "https://www.bollywoodhungama.com/full-coverage/2023-09-05/",
  },
  {
    publication: "NewsVoir",
    logo: "NEWSVOIR",
    title: "Bespokewala's Adaa Collection Unveiled by Showstopper Saiee Manjrekar at the GMFL Runway Showcase in Dubai",
    year: "2023",
    category: "Fashion",
    url: "https://www.newsvoir.com/release/bespokewala-apos-s-adaa-collection-unveiled-by-showstopper-saiee-manjrekar-at-the-gmfl-runway-showcase-in-dubai-25667.html",
  },
  {
    publication: "Live Mumbai",
    logo: "LIVE MUMBAI",
    title: "India and South Korea Collaborate in a Spectacular Beauty and Fashion Showcase at the Grand Finale of Face of India 2023",
    year: "2023",
    category: "Events",
    url: "https://livemumbai.in/index.php/2023/10/04/india-and-south-korea-collaborate-in-a-spectacular-beauty-and-fashion-showcase-at-the-grand-finale-of-face-of-india-2023-held-in-mumbai/",
  },
  {
    publication: "ThePrint / ANI",
    logo: "THEPRINT / ANI",
    title: "Universal Eminence Awards 2024 Season 1 Celebrates Visionaries Shaping the Future",
    year: "2024",
    category: "Awards",
    url: "https://theprint.in/ani-press-releases/universal-eminence-awards-2024-season-1-celebrates-visionaries-shaping-the-future/2253877/",
  },
];

const MEDIA_STATS = [
  { number: "200K+",  label: "Customers"            },
  { number: "12",     label: "Awards Won"            },
  { number: "6",      label: "Films Costumed"       },
];

const AWARDS = [
  { 
    year: "2024", 
    award: "Iconic Designer in Ethnic Wear", 
    body: "Universal Eminence Awards Season 1",
    links: [
      { label: "View Source", url: "https://www.linkedin.com/posts/universal-eminence-awards_universaleminenceawards-bespokewala-bespokewalabyhimaliraj-activity-7232968818392764416-RAOU" },
      { label: "Read Coverage", url: "https://theprint.in/ani-press-releases/universal-eminence-awards-2024-season-1-celebrates-visionaries-shaping-the-future/2253877/" }
    ]
  },
  { year: "2024", award: "Designer of the Year (Bridal & Groom – Indian)", body: "Midday Retail and Lifestyle Icons" },
  { 
    year: "2024", 
    award: "Face of India", 
    body: "Asia Model Festival",
    links: [
      { label: "Read Coverage", url: "https://deccanbusiness.com/strengthening-cultural-ties-india-and-south-korea-collaborate-in-a-spectacular-beauty-and-fashion-showcase-at-the-grand-finale-of-face-of-india-2023-held-in-mumbai/" }
    ]
  },
  { year: "2023", award: "Iconic Fashion Designer", body: "Midday Icons" },
  { year: "2022", award: "Times Leading Icons", body: "The Times Group" },
  { 
    year: "2020", 
    award: "Iconic Luxury Fashion Brand", 
    body: "Midday Retail Icons",
    links: [
      { label: "Read Coverage", url: "https://economictimes.indiatimes.com/magazines/panache/achievers-2020-recognising-and-honouring-achievers/articleshow/80442702.cms" }
    ]
  },
];

export default function PressPageContent() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .press-fade { animation: fadeUp 0.65s ease both; }

        /* ── press quote cards ── */
        .press-card {
          background: #fff;
          border: 1px solid #e8e0d6;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: box-shadow 0.3s, transform 0.3s, border-color 0.3s;
        }
        .press-card:hover {
          box-shadow: 0 10px 32px rgba(0,0,0,0.07);
          transform: translateY(-4px);
          border-bottom: 3px solid #d2b48c;
        }
        .press-pub-logo {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.25em;
          color: #1c1c1c;
        }

        /* ── stat strip ── */
        .stat-item { text-align: center; padding: 1.5rem 1rem; }

        /* ── award rows ── */
        .award-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e8e0d6;
        }
        .award-row:first-child { border-top: 1px solid #e8e0d6; }
        .award-link {
          font-size: 0.65rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #d2b48c;
          border: 1px solid #d2b48c;
          padding: 0.35rem 0.75rem;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
          display: inline-block;
        }
        .award-link:hover {
          background-color: #d2b48c;
          color: #fff;
        }

        /* ── media kit box ── */
        .kit-item {
          background: #fff;
          border: 1px solid #e8e0d6;
          padding: 1.75rem;
          text-align: center;
          transition: box-shadow 0.3s, transform 0.3s;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .kit-item:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
          transform: translateY(-3px);
        }

        /* ── responsive ── */
        .press-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .kit-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        .press-contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 960px) {
          .press-grid   { grid-template-columns: repeat(2, 1fr); }
          .stat-grid    { grid-template-columns: repeat(2, 1fr); }
          .kit-grid     { grid-template-columns: repeat(2, 1fr); }
          .press-contact-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 540px) {
          .press-grid   { grid-template-columns: 1fr; }
          .kit-grid     { grid-template-columns: 1fr 1fr; }
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
          Media &amp; Press
        </p>
        <h1 style={{ fontSize: "clamp(2rem,7vw,3.75rem)", fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Press &amp; Coverage
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.5rem" }} />
        <p style={{ fontSize: "clamp(0.85rem,2vw,0.95rem)", fontWeight: 300, maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, color: "rgba(255,255,255,0.72)" }}>
          Bespokewala has been featured in India&apos;s leading fashion publications, celebrated for its commitment to artisanal craftsmanship and contemporary Indian design.
        </p>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ backgroundColor: "#d2b48c" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="stat-grid">
            {MEDIA_STATS.map(({ number, label }) => (
              <div key={label} className="stat-item">
                <p style={{ fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 300, color: "#1c1c1c", letterSpacing: "0.05em", lineHeight: 1 }}>
                  {number}
                </p>
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a3e28", marginTop: "0.5rem" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AS SEEN IN LOGOS ══ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3rem,7vw,4.5rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", textAlign: "center", marginBottom: "2.5rem" }}>
            As Seen In
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "2.5rem 4rem" }}>
            {["THE ECONOMIC TIMES", "BOLLYWOOD HUNGAMA", "NEWSVOIR", "LIVE MUMBAI", "THEPRINT", "ANI", "MID-DAY", "TIMES OF INDIA"].map(pub => (
              <span key={pub} style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                letterSpacing: "0.3em",
                color: "#bbb",
                textTransform: "uppercase",
                transition: "color 0.3s",
                cursor: "default",
                userSelect: "none",
              }}>
                {pub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRESS QUOTES ══ */}
      <section style={{ backgroundColor: "#fff", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>What They Say</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Press Coverage
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div className="press-grid">
            {PRESS_COVERAGE.map((item, i) => (
              <div key={i} className="press-card press-fade" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className="press-pub-logo" style={{ fontSize: "0.9rem" }}>{item.logo}</span>
                  <span style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#d2b48c", background: "#fdf5e8", padding: "0.25rem 0.6rem", flexShrink: 0, marginLeft: "0.5rem" }}>
                    {item.category}
                  </span>
                </div>

                <p style={{ fontSize: "0.95rem", fontWeight: 500, color: "#333", lineHeight: 1.6, flexGrow: 1 }}>
                  {item.title}
                </p>

                <div style={{ borderTop: "1px solid #f0ebe4", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: "0.72rem", color: "#aaa" }}>{item.publication} &nbsp;·&nbsp; {item.year}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="award-link" style={{ margin: 0, fontSize: "0.6rem" }}>
                    Read Article &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AWARDS & RECOGNITION ══ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Recognised Excellence</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Awards &amp; Recognition
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          {AWARDS.map((a, i) => (
            <div key={i} className="award-row">
              <span style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#d2b48c",
                letterSpacing: "0.1em",
                minWidth: "44px",
                flexShrink: 0,
              }}>
                {a.year}
              </span>
              <span style={{ fontSize: "1.1rem", color: "#d2b48c", flexShrink: 0 }}>✦</span>
              <div style={{ flexGrow: 1 }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1c", marginBottom: "0.2rem" }}>{a.award}</p>
                <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: a.links ? "0.75rem" : "0" }}>{a.body}</p>
                {a.links && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {a.links.map((link, j) => (
                      <a
                        key={j}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="award-link"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BRAND STORY (FOR PRESS) ══ */}
      <section style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Brand Story</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "0" }}>
              About Bespokewala
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem 0 0" }} />
          </div>

          {[
            "Bespokewala was born from a conviction that Indian fashion deserves to be seen, celebrated, and worn with pride. Founded in Mumbai, the label brings together master craftspeople from across India — zardozi embroiderers from Lucknow, block-print artisans from Jaipur, silk weavers from Banaras — and gives their work a contemporary home.",
            "At the heart of Bespokewala is a bespoke atelier service: every client who walks through our doors in Andheri West receives a personal consultation, a precise made-to-measure experience, and a garment crafted entirely by hand. No mass production. No shortcuts.",
            "The label has grown from a small studio into one of Mumbai's most celebrated fashion destinations — beloved by brides, celebrities, and fashion enthusiasts who value the irreplaceable quality of true handcraft.",
          ].map((para, i) => (
            <p key={i} style={{ fontSize: "0.925rem", color: "#ccc", lineHeight: 1.9, marginBottom: "1.25rem" }}>
              {para}
            </p>
          ))}

          <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", marginTop: "2rem", borderTop: "1px solid #333", paddingTop: "2rem" }}>
            {[
              { label: "Founded",   value: "2002" },
              { label: "Location",  value: "Mumbai, India" },
              { label: "Speciality",value: "Bridal & Bespoke Couture" },
              { label: "Artisans",  value: "50+ Skilled Craftspeople" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.3rem" }}>{label}</p>
                <p style={{ fontSize: "0.9rem", color: "#fff" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MEDIA KIT ══ */}
      <section style={{ backgroundColor: "#fff", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>
              For Journalists &amp; Editors
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Media Kit
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "#666", maxWidth: "480px", margin: "0 auto" }}>
              Download our official brand assets and press materials for editorial use.
            </p>
          </div>

          <div className="kit-grid">
            {[
              { icon: "🖼️", title: "Brand Logo Pack",      desc: "PNG, SVG & EPS in colour, white, and black variants." },
              { icon: "📸", title: "Press Photography",     desc: "High-resolution campaign and editorial images." },
              { icon: "📄", title: "Press Release",         desc: "Latest brand press release — Q2 2026." },
              { icon: "📋", title: "Brand Guidelines",      desc: "Colour palette, typography, and tone of voice guide." },
            ].map(({ icon, title, desc }) => (
              <a
                key={title}
                href="mailto:info@bespokewala.com?subject=Media Kit Request&body=Hello, I am requesting the Bespokewala media kit for editorial use."
                className="kit-item"
              >
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.75rem" }}>{icon}</span>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1c1c1c", marginBottom: "0.5rem" }}>
                  {title}
                </p>
                <p style={{ fontSize: "0.78rem", color: "#888", lineHeight: 1.65 }}>{desc}</p>
                <p style={{ fontSize: "0.7rem", color: "#d2b48c", marginTop: "1rem", letterSpacing: "0.08em" }}>
                  Request via Email →
                </p>
              </a>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#bbb", marginTop: "1.5rem" }}>
            Email <a href="mailto:info@bespokewala.com" style={{ color: "#d2b48c" }}>info@bespokewala.com</a> with subject &ldquo;Media Kit Request&rdquo; and we&apos;ll send you the full kit within 24 hours.
          </p>
        </div>
      </section>

      {/* ══ PRESS CONTACT ══ */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Get in Touch</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c1c1c" }}>
              Press Enquiries
            </h2>
            <div style={{ width: "50px", height: "1px", background: "#d2b48c", margin: "1.25rem auto 0" }} />
          </div>

          <div className="press-contact-grid">
            <div style={{ background: "#1c1c1c", padding: "2.5rem", color: "#fff" }}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.5rem" }}>
                Media Contact
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                  { icon: "✉",  label: "Press Email",    value: "info@bespokewala.com",      href: "mailto:info@bespokewala.com?subject=Press Enquiry" },
                  { icon: "📱", label: "PR WhatsApp",    value: "+91 75067 67452",             href: "https://wa.me/917506767452?text=Hello%2C%20I%20have%20a%20press%20enquiry%20for%20Bespokewala." },
                  { icon: "📍", label: "Studio Address", value: "Lotus Arc One, Andheri West, Mumbai – 400053", href: "#" },
                  { icon: "📸", label: "Instagram",      value: "@bespokewala",                href: "https://www.instagram.com/bespokewala?igsh=Y3Zud3V3OHd6OTIz" },
                ].map(({ icon, label, value, href }) => (
                  <div key={label}>
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.3rem" }}>{icon} {label}</p>
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                      style={{ fontSize: "0.875rem", color: "#d2b48c", textDecoration: "none", wordBreak: "break-all" }}>
                      {value}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e8e0d6", padding: "2.5rem" }}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.5rem" }}>
                We Welcome
              </p>
              {[
                { icon: "📰", text: "Feature articles and editorial shoots" },
                { icon: "🎙️", text: "Podcast and interview requests" },
                { icon: "🎬", text: "Styling for film, TV, and OTT productions" },
                { icon: "🤝", text: "Brand collaboration and co-creation" },
                { icon: "🏆", text: "Award nominations and panel invitations" },
                { icon: "🎤", text: "Speaking engagements at fashion events" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
                  <p style={{ fontSize: "0.875rem", color: "#444", lineHeight: 1.7 }}>{text}</p>
                </div>
              ))}
              <div style={{ marginTop: "1.75rem" }}>
                <a href="mailto:info@bespokewala.com?subject=Press Enquiry" className="btn-primary" style={{ fontSize: "0.8rem" }}>
                  Send Press Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "clamp(3rem,7vw,4.5rem) 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1rem" }}>Follow the Story</p>
        <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 300, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
          Stay Updated with Bespokewala
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#aaa", maxWidth: "400px", margin: "0 auto 2rem", lineHeight: 1.8 }}>
          Follow our collections, behind-the-scenes atelier moments, and press features on Instagram.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <a href="https://www.instagram.com/bespokewala?igsh=Y3Zud3V3OHd6OTIz" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Follow on Instagram
          </a>
          <Link href="/contact" className="btn-secondary" style={{ color: "#fff", borderColor: "#fff" }}>
            Contact PR Team
          </Link>
        </div>
      </section>
    </>
  );
}
