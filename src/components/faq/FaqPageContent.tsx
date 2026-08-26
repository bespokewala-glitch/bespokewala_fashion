/* Pure server component — zero useState/useEffect, zero hydration risk.
   Accordion open/close powered by <details>/<summary> HTML — fully accessible,
   no JS required, works on server render perfectly.                         */

const CATEGORIES = [
  {
    id: "orders",
    icon: "🛍️",
    title: "Orders & Payments",
    faqs: [
      {
        q: "How do I place an order on Bespokewala?",
        a: "Browse our collections, select your size and quantity, and click 'Add to Cart'. Once you're ready, proceed to checkout, fill in your shipping details, and complete payment. You'll receive an order confirmation email within minutes.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major Credit & Debit Cards (Visa, Mastercard, Amex, RuPay), Net Banking, UPI (GPay, PhonePe, Paytm), EMI options via select banks, and Cash on Delivery (COD) for orders within India below ₹50,000.",
      },
      {
        q: "Is it safe to use my credit/debit card on your website?",
        a: "Absolutely. Our website uses 256-bit SSL encryption and is PCI-DSS compliant. We do not store your card details — all transactions are processed securely through our payment gateway partners (Razorpay / PayU).",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "Order modifications or cancellations are possible within 2 hours of placing the order. After that, the order enters our dispatch queue. Please email bespokewala@gmail.com or WhatsApp us immediately at +91 75067 67452 with your order number.",
      },
      {
        q: "Will I receive an invoice for my order?",
        a: "Yes. A GST-compliant invoice is automatically emailed to you once your order is confirmed. You can also download it from your account dashboard under 'My Orders'.",
      },
      {
        q: "Do you offer EMI options?",
        a: "Yes, No-Cost EMI is available for 3, 6, and 9 months on select Credit Cards (HDFC, ICICI, Axis, SBI, Kotak, Yes Bank) for orders above ₹5,000. EMI options are displayed at checkout based on your card.",
      },
    ],
  },
  {
    id: "products",
    icon: "👗",
    title: "Products & Sizing",
    faqs: [
      {
        q: "How do I find the right size?",
        a: "Each product page includes a detailed Size Guide with measurements in both inches and centimetres. We recommend measuring your bust, waist, and hip before ordering. If you're between sizes, we suggest sizing up for comfort. For custom orders, we take precise measurements during your consultation.",
      },
      {
        q: "Are your products made in India?",
        a: "Yes, every Bespokewala piece is crafted entirely in India by skilled artisans. Our fabrics are sourced from renowned textile hubs — Banaras for silks, Jaipur for block-prints, Surat for chiffons — and all embroidery is done by hand in our Mumbai atelier.",
      },
      {
        q: "How should I care for my Bespokewala garment?",
        a: "All garments come with a care label. As a general rule: handwash or dry-clean only for embroidered pieces; use cold water and a gentle detergent; never tumble-dry or wring delicate fabrics; store in a breathable muslin bag away from direct sunlight.",
      },
      {
        q: "Do the colours look exactly as shown on screen?",
        a: "We make every effort to photograph garments under accurate lighting. However, colours may vary slightly depending on your screen's colour calibration. If colour accuracy is critical (e.g. for a bridal trousseau), we recommend visiting our studio or requesting a fabric swatch.",
      },
      {
        q: "Can I request a fabric swatch before ordering?",
        a: "Yes. For orders above ₹10,000, you may request up to 3 fabric swatches. Email bespokewala@gmail.com with the product names and your shipping address. Swatches are sent free of charge within India.",
      },
      {
        q: "Are the products in stock, or made to order?",
        a: "Most ready-to-wear pieces are in stock and dispatch within 1–2 business days. Limited-edition and festive pieces may be made to order and have a lead time of 7–14 business days, clearly mentioned on the product page.",
      },
    ],
  },
  {
    id: "custom",
    icon: "✂️",
    title: "Custom & Bespoke Orders",
    faqs: [
      {
        q: "Do you offer custom / made-to-measure garments?",
        a: "Yes — custom orders are at the heart of what we do. You can request a fully bespoke garment or a made-to-measure version of any existing design. Contact us via email or WhatsApp to begin a personalised consultation.",
      },
      {
        q: "How long does a custom order take?",
        a: "Lead times vary by the complexity of the garment. Ready-to-wear alterations: 7–10 days. Semi-custom (custom fit on a standard design): 14–21 days. Fully bespoke couture: 4–8 weeks. All timelines are confirmed at the time of booking.",
      },
      {
        q: "What is the process for a bespoke order?",
        a: "Step 1 — Initial consultation (in-studio or virtual). Step 2 — Design brief & fabric selection. Step 3 — Measurement taking. Step 4 — First fitting (muslin toile). Step 5 — Embroidery & finishing. Step 6 — Final fitting. Step 7 — Delivery. We keep you updated throughout.",
      },
      {
        q: "Can I customise an existing design from your collection?",
        a: "Yes. You can request changes to neckline, sleeve style, length, colour, embroidery pattern, or fabric on most of our designs. Customisation charges vary and are quoted after a brief design consultation.",
      },
      {
        q: "Are custom orders returnable?",
        a: "Custom and bespoke orders are non-returnable and non-refundable as they are crafted specifically for you. However, we offer complimentary alterations within 7 days of delivery for bespoke items to ensure a perfect fit.",
      },
      {
        q: "Do you offer bridal consultation services?",
        a: "Yes. We offer dedicated bridal consultations at our Mumbai studio by appointment. Our bridal specialist helps you choose fabrics, embroideries, and silhouettes that complement your wedding aesthetic. Call or WhatsApp +91 75067 67452 to book.",
      },
    ],
  },
  {
    id: "shipping",
    icon: "🚚",
    title: "Shipping & Delivery",
    faqs: [
      {
        q: "How long does delivery take?",
        a: "Delivery timelines depend on the product category. Ready-to-wear garments and accessories dispatch within 7-14 days. Footwear typically takes 15-20 days. Couture, gowns, and bespoke lehengas take 40-50 days. International delivery takes an additional 7-10 business days after dispatch.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! Free standard shipping is available on all India orders above ₹15,000 and on all international orders above ₹1,00,000. For orders below these thresholds, domestic shipping costs ₹199 and international starts at ₹1,200.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship to 40+ countries including the UAE, USA, UK, Canada, Australia, Singapore, and most of Europe. Shipping rates and delivery timelines vary by region — details are on our Shipping page.",
      },
      {
        q: "How can I track my order?",
        a: "Once your order is dispatched, you will receive an SMS and email with your tracking number and the courier partner's name (Blue Dart / Delhivery / FedEx / DHL). Track directly on the courier's website using the provided number.",
      },
      {
        q: "Will I be charged customs duties on international orders?",
        a: "Import duties and taxes are determined by the destination country's customs authority and are the buyer's responsibility. We declare the true value of all shipments on customs forms as legally required.",
      },
    ],
  },
  {
    id: "returns",
    icon: "↩️",
    title: "Returns & Refunds",
    faqs: [
      {
        q: "What is your return policy?",
        a: "Ready-to-wear items can be returned within 7 days of delivery, provided they are unused, unwashed, and in original condition with all tags attached. Initiate the return by emailing bespokewala@gmail.com with your order number.",
      },
      {
        q: "How long does it take to get a refund?",
        a: "Once we receive and inspect the returned item (2–3 business days after arrival), refunds are processed to your original payment method within 7–10 business days. Store credits are issued within 24 hours of approval.",
      },
      {
        q: "Can I exchange my product for a different size?",
        a: "Yes, size exchanges are accepted within 14 days of delivery. If the desired size is unavailable, we will issue a store credit valid for 6 months. Email us with your order number and the size you need.",
      },
      {
        q: "What items cannot be returned?",
        a: "The following are non-returnable: Custom / bespoke orders (though they include complimentary alterations within 7 days), altered garments, jewellery (for hygiene), sale items marked 'Final Sale', and items without original tags or packaging.",
      },
      {
        q: "What if I received a damaged or wrong item?",
        a: "We sincerely apologise. Please email bespokewala@gmail.com within 48 hours of delivery with photos of the issue and your order number. We will arrange a complimentary pickup and send a replacement or full refund within 5–7 business days.",
      },
    ],
  },
  {
    id: "account",
    icon: "👤",
    title: "Account & Loyalty",
    faqs: [
      {
        q: "Do I need an account to place an order?",
        a: "You can browse our catalogue without an account, but creating one is required to complete a purchase. An account gives you order tracking, saved addresses, wishlist access, and exclusive member offers.",
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Login' on the top menu, then 'Forgot Password'. Enter your registered email address and we'll send a reset link within a few minutes. Check your spam folder if you don't see it in your inbox.",
      },
      {
        q: "Is there a loyalty programme?",
        a: "Yes — Bespokewala Insiders! Every purchase earns you reward points redeemable on future orders. Members also get early access to new collections, exclusive discounts, and invitations to private preview events. Points are automatically credited to your account after every order.",
      },
      {
        q: "Can I save items to a wishlist?",
        a: "Yes. Click the heart icon on any product page to save it to your wishlist. You can view and manage your wishlist from your account dashboard. Wishlist items can be shared via link or directly added to cart.",
      },
    ],
  },
];

export default function FaqPageContent() {
  return (
    <>
      <style>{`
        /* ── animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── category pill nav ── */
        .faq-pill-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 3.5rem;
        }
        .faq-pill {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          border: 1px solid #e8e0d6;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #555;
          text-decoration: none;
          transition: background-color 0.25s, color 0.25s, border-color 0.25s;
          background: #fff;
        }
        .faq-pill:hover {
          background: #1c1c1c;
          color: #d2b48c;
          border-color: #1c1c1c;
        }

        /* ── category section ── */
        .faq-category {
          margin-bottom: 3.5rem;
          animation: fadeUp 0.7s ease both;
        }
        .faq-category-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #1c1c1c;
        }
        .faq-category-icon {
          font-size: 1.4rem;
          line-height: 1;
        }

        /* ── details/summary accordion ── */
        details.faq-item {
          border-bottom: 1px solid #e8e0d6;
        }
        details.faq-item:first-of-type {
          border-top: 1px solid #e8e0d6;
        }
        summary.faq-q {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 0;
          font-size: 0.9rem;
          font-weight: 500;
          color: #1c1c1c;
          letter-spacing: 0.02em;
          cursor: pointer;
          list-style: none;
          user-select: none;
          transition: color 0.2s;
        }
        summary.faq-q::-webkit-details-marker { display: none; }
        summary.faq-q::after {
          content: '+';
          font-size: 1.4rem;
          font-weight: 300;
          color: #d2b48c;
          flex-shrink: 0;
          line-height: 1;
          transition: transform 0.3s;
        }
        details[open] > summary.faq-q { color: #3d352e; }
        details[open] > summary.faq-q::after {
          content: '−';
          transform: rotate(0deg);
        }
        summary.faq-q:hover { color: #d2b48c; }

        .faq-a {
          padding: 0 0 1.5rem 0;
          font-size: 0.875rem;
          color: #555;
          line-height: 1.85;
          max-width: 760px;
        }

        /* ── contact strip ── */
        .faq-contact-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }

        /* ── responsive ── */
        @media (max-width: 768px) {
          summary.faq-q { font-size: 0.85rem; }
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
          Got Questions?
        </p>
        <h1 style={{
          fontSize: "clamp(2rem,7vw,3.75rem)",
          fontWeight: 300,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          lineHeight: 1.1,
          marginBottom: "1.5rem",
        }}>
          Frequently Asked<br />Questions
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.5rem" }} />
        <p style={{
          fontSize: "clamp(0.85rem,2vw,0.975rem)",
          fontWeight: 300,
          maxWidth: "520px",
          margin: "0 auto",
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.72)",
        }}>
          Everything you need to know about ordering, shipping, returns, custom garments, and more — answered clearly.
        </p>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section style={{ backgroundColor: "#faf9f7", padding: "clamp(3.5rem,8vw,6rem) 1.5rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>

          {/* Category quick-links */}
          <nav className="faq-pill-nav" aria-label="FAQ categories">
            {CATEGORIES.map(cat => (
              <a key={cat.id} href={`#${cat.id}`} className="faq-pill">
                {cat.icon} {cat.title}
              </a>
            ))}
          </nav>

          {/* FAQ sections */}
          {CATEGORIES.map((cat, ci) => (
            <section
              key={cat.id}
              id={cat.id}
              className="faq-category"
              style={{ animationDelay: `${ci * 0.07}s` }}
            >
              <div className="faq-category-header">
                <span className="faq-category-icon">{cat.icon}</span>
                <h2 style={{
                  fontSize: "clamp(1rem,2.5vw,1.2rem)",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#1c1c1c",
                }}>
                  {cat.title}
                </h2>
                <span style={{
                  fontSize: "0.7rem",
                  color: "#d2b48c",
                  letterSpacing: "0.1em",
                  marginLeft: "auto",
                  flexShrink: 0,
                }}>
                  {cat.faqs.length} questions
                </span>
              </div>

              {cat.faqs.map((faq, fi) => (
                <details key={fi} className="faq-item">
                  <summary className="faq-q">{faq.q}</summary>
                  <p className="faq-a">{faq.a}</p>
                </details>
              ))}
            </section>
          ))}
        </div>
      </section>

      {/* ── STILL HAVE QUESTIONS CTA ── */}
      <section style={{
        backgroundColor: "#1c1c1c",
        color: "#fff",
        padding: "clamp(3rem,8vw,5.5rem) 1.5rem",
        textAlign: "center",
      }}>
        <span style={{ fontSize: "2rem", display: "block", marginBottom: "1rem" }}>💬</span>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1rem" }}>
          Still Need Help?
        </p>
        <h2 style={{
          fontSize: "clamp(1.4rem,3vw,2rem)",
          fontWeight: 300,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}>
          We&apos;re Just a Message Away
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#aaa", maxWidth: "460px", margin: "0 auto 2.25rem", lineHeight: 1.8 }}>
          Our team is available Monday to Saturday, 10am–8pm IST. Reach us through any of the channels below.
        </p>

        <div className="faq-contact-strip">
          <a
            href="mailto:bespokewala@gmail.com"
            className="btn-primary"
          >
            ✉ Email Us
          </a>
          <a
            href="https://wa.me/917506767452?text=Hello%20Bespokewala%2C%20I%20have%20a%20question."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ color: "#fff", borderColor: "#fff" }}
          >
            💬 WhatsApp Us
          </a>
          <a
            href="/contact"
            className="btn-secondary"
            style={{ color: "#fff", borderColor: "#fff" }}
          >
            Contact Page →
          </a>
        </div>

        <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "2rem" }}>
          📍 &nbsp; Or visit us at: Lotus Arc One, Monginis Lane, Off New Link Road, Andheri West, Mumbai – 400053
        </p>
      </section>
    </>
  );
}
