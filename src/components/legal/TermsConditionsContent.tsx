/* Pure server component — no useState/useEffect, no hydration risk */
import Link from 'next/link';

const LAST_UPDATED = "1 August 2026";

export default function TermsConditionsContent() {
  return (
    <>
      <style>{`
        .legal-body { max-width: 860px; margin: 0 auto; padding: clamp(3rem,8vw,5rem) 1.5rem; }
        .legal-toc {
          background: #faf9f7;
          border: 1px solid #e8e0d6;
          border-left: 4px solid #d2b48c;
          padding: 1.5rem 2rem;
          margin-bottom: 3rem;
        }
        .legal-toc ol { margin: 0.75rem 0 0 1.25rem; padding: 0; }
        .legal-toc li { margin-bottom: 0.35rem; }
        .legal-toc a { color: #d2b48c; font-size: 0.85rem; text-decoration: none; letter-spacing: 0.03em; }
        .legal-toc a:hover { text-decoration: underline; }

        .legal-section { margin-bottom: 2.75rem; scroll-margin-top: 100px; }
        .legal-section h2 {
          font-size: clamp(1rem, 2vw, 1.15rem);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1c1c1c;
          margin-bottom: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 2px solid #e8e0d6;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .legal-section h2 span.sec-num {
          font-size: 0.65rem;
          color: #d2b48c;
          background: #1c1c1c;
          padding: 0.2rem 0.6rem;
          letter-spacing: 0.1em;
          flex-shrink: 0;
        }
        .legal-section p { font-size: 0.9rem; color: #444; line-height: 1.9; margin-bottom: 0.9rem; }
        .legal-section ul, .legal-section ol { margin: 0.5rem 0 0.9rem 1.5rem; padding: 0; }
        .legal-section li { font-size: 0.9rem; color: #444; line-height: 1.85; margin-bottom: 0.3rem; }
        .legal-section strong { color: #1c1c1c; }

        .legal-highlight {
          background: #fffbf0;
          border: 1px solid #f0dfa0;
          padding: 1rem 1.25rem;
          font-size: 0.85rem;
          color: #5a4a10;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .legal-warning {
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-left: 4px solid #ef4444;
          padding: 1rem 1.25rem;
          font-size: 0.85rem;
          color: #7f1d1d;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .legal-contact-box {
          background: #1c1c1c;
          color: #fff;
          padding: 2rem;
          margin-top: 3rem;
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(135deg, #1c1c1c 0%, #2d2520 60%, #3d352e 100%)",
        color: "#fff",
        padding: "clamp(7rem,15vw,10rem) 1.5rem clamp(3rem,8vw,5rem)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "1.25rem" }}>
          Legal
        </p>
        <h1 style={{ fontSize: "clamp(2rem,6vw,3.5rem)", fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.25rem" }}>
          Terms &amp; Conditions
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.25rem" }} />
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
          Last updated: {LAST_UPDATED}
        </p>
      </section>

      {/* ── BODY ── */}
      <div className="legal-body">

        {/* Intro */}
        <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: 1.9, marginBottom: "1rem" }}>
          Welcome to <strong>Bespokewala Fashion</strong> (&ldquo;Bespokewala&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
          These Terms &amp; Conditions govern your use of our website and the purchase of products from us.
          By accessing our website or placing an order, you agree to be bound by these terms.
          If you do not agree, please do not use our website.
        </p>

        <div className="legal-highlight">
          ℹ️ These Terms constitute a legally binding agreement between you and Bespokewala Fashion, a business
          registered in Mumbai, Maharashtra, India. All disputes are subject to the jurisdiction of courts in Mumbai.
        </div>

        {/* Table of Contents */}
        <div className="legal-toc">
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d2b48c", fontWeight: 600 }}>
            Table of Contents
          </p>
          <ol>
            {[
              "Eligibility & Account",
              "Products & Descriptions",
              "Pricing & Payment",
              "Orders & Cancellations",
              "Shipping & Delivery",
              "Returns, Exchanges & Refunds",
              "Custom & Bespoke Orders",
              "Intellectual Property",
              "User Conduct",
              "Limitation of Liability",
              "Governing Law & Disputes",
              "Changes to Terms",
              "Contact Us",
            ].map((item, i) => (
              <li key={i}><a href={`#tc-${i + 1}`}>{item}</a></li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        {[
          {
            id: "tc-1",
            num: "01",
            title: "Eligibility & Account",
            content: (
              <>
                <p>By using our website, you confirm that:</p>
                <ul>
                  <li>You are at least 18 years of age, or have parental/guardian consent.</li>
                  <li>You are legally capable of entering into binding contracts under the Indian Contract Act, 1872.</li>
                  <li>The information you provide is accurate, current, and complete.</li>
                </ul>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account. Notify us immediately at bespokewala@gmail.com of any unauthorised use.</p>
                <p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activity.</p>
              </>
            ),
          },
          {
            id: "tc-2",
            num: "02",
            title: "Products & Descriptions",
            content: (
              <>
                <p>We make every effort to display our products accurately, including colours, embroidery, fabric texture, and dimensions. However:</p>
                <ul>
                  <li>Colours may vary slightly due to screen calibration and photography lighting.</li>
                  <li>Handcrafted and hand-embroidered products may have minor natural variations — this is a mark of authenticity, not a defect.</li>
                  <li>Fabric weights and textures are described to the best of our ability; we recommend requesting swatches for high-value orders.</li>
                  <li>All measurements provided are approximate and may have a tolerance of ±1–2 cm.</li>
                </ul>
                <p>We reserve the right to limit quantities, discontinue products, or correct pricing errors without prior notice.</p>
              </>
            ),
          },
          {
            id: "tc-3",
            num: "03",
            title: "Pricing & Payment",
            content: (
              <>
                <p><strong>Pricing:</strong> All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise. Prices are subject to change without notice; however, the price at the time of your order confirmation will apply to your order.</p>
                <p><strong>Payment:</strong> We accept Credit/Debit Cards, Net Banking, UPI, EMI, and Cash on Delivery (COD, within India, for eligible orders). All payments are processed securely via our payment gateway. We do not store card details on our servers.</p>
                <p><strong>COD:</strong> Cash on Delivery is available for orders below ₹50,000 within India. A COD convenience fee of ₹50 may apply. COD is not available for custom or bespoke orders.</p>
                <p><strong>International:</strong> International orders are processed in INR at the prevailing exchange rate. Your bank may charge foreign transaction fees.</p>
                <div className="legal-highlight">
                  💳 If payment is declined or reversed after dispatch, we reserve the right to take legal action for recovery of dues including shipping and product costs.
                </div>
              </>
            ),
          },
          {
            id: "tc-4",
            num: "04",
            title: "Orders & Cancellations",
            content: (
              <>
                <p>An order is confirmed only upon receipt of a confirmation email from us. We reserve the right to refuse or cancel any order for reasons including but not limited to:</p>
                <ul>
                  <li>Product unavailability or stock discrepancies.</li>
                  <li>Pricing errors on the website.</li>
                  <li>Suspicious or fraudulent activity.</li>
                  <li>Non-delivery of payment.</li>
                </ul>
                <p><strong>Customer Cancellations:</strong> You may cancel an order within <strong>2 hours</strong> of placement by emailing bespokewala@gmail.com with your order number. After this window, the order enters production/dispatch and cannot be cancelled. Custom orders cannot be cancelled once confirmed.</p>
                <p>Approved cancellations will receive a full refund to the original payment method within 7–10 business days.</p>
              </>
            ),
          },
          {
            id: "tc-5",
            num: "05",
            title: "Shipping & Delivery",
            content: (
              <>
                <p>We ship across India and internationally. Delivery timelines are estimates and may be affected by courier delays, public holidays, natural disasters, or other unforeseen circumstances. We are not liable for delays caused by third-party courier partners.</p>
                <ul>
                  <li>Risk of loss passes to you upon delivery to the carrier.</li>
                  <li>If you are unavailable at delivery, the courier will attempt re-delivery up to 3 times. Unclaimed packages may be returned to us and re-shipping charges will apply.</li>
                  <li>For international shipments, customs duties and import taxes are the buyer&apos;s sole responsibility.</li>
                  <li>We are not responsible for delays caused by customs clearance processes.</li>
                </ul>
                <p>Please refer to our <Link href="/shipping" style={{ color: "#d2b48c" }}>Shipping &amp; Returns page</Link> for full details on rates and timelines.</p>
              </>
            ),
          },
          {
            id: "tc-6",
            num: "06",
            title: "Returns, Exchanges & Refunds",
            content: (
              <>
                <p><strong>Returns:</strong> Ready-to-wear items may be returned within <strong>7 days</strong> of delivery, provided they are unused, unwashed, unaltered, and in original packaging with all tags attached.</p>
                <p><strong>Exchanges:</strong> Size/colour exchanges are accepted within <strong>14 days</strong> of delivery.</p>
                <p><strong>Non-Returnable Items:</strong></p>
                <ul>
                  <li>Custom and bespoke orders</li>
                  <li>Altered or damaged garments</li>
                  <li>Jewellery (for hygiene reasons)</li>
                  <li>Sale items marked &ldquo;Final Sale&rdquo;</li>
                  <li>Items without original tags or packaging</li>
                  <li>Items returned after 7 days of delivery</li>
                </ul>
                <p><strong>Refunds:</strong> Approved refunds are processed to the original payment method within 7–10 business days of return receipt and inspection. We do not offer refunds in cash.</p>
                <div className="legal-warning">
                  ⚠ Items that show signs of use, washing, alteration, or damage will not be accepted for return and will be sent back to the customer at their cost.
                </div>
              </>
            ),
          },
          {
            id: "tc-7",
            num: "07",
            title: "Custom & Bespoke Orders",
            content: (
              <>
                <p>Custom and bespoke orders are subject to the following additional terms:</p>
                <ul>
                  <li>A <strong>50% advance payment</strong> is required to confirm a custom order. The balance is due before dispatch.</li>
                  <li>Measurement accuracy is the customer&apos;s responsibility. We are not liable for ill-fitting garments due to incorrect measurements provided by the customer.</li>
                  <li>Minor design variations from reference images are inherent to handcraftsmanship and are not grounds for cancellation or refund.</li>
                  <li>One complimentary alteration is included with every bespoke order, subject to a fitting appointment at our Mumbai studio.</li>
                  <li>Lead times quoted are estimates. Delays of up to 2 weeks beyond the stated timeline do not constitute a breach of contract and are not grounds for cancellation.</li>
                  <li>Custom orders are <strong>non-refundable</strong> once production has commenced.</li>
                </ul>
              </>
            ),
          },
          {
            id: "tc-8",
            num: "08",
            title: "Intellectual Property",
            content: (
              <>
                <p>All content on our website — including designs, photographs, text, graphics, logos, the Bespokewala brand name, and the overall website design — is the exclusive property of Bespokewala Fashion and is protected under applicable Indian and international intellectual property laws.</p>
                <ul>
                  <li>You may not reproduce, distribute, modify, display, or use our content for commercial purposes without our express written consent.</li>
                  <li>You may not copy or imitate our designs, garments, or embroidery patterns.</li>
                  <li>User-generated content (e.g. reviews) grants us a non-exclusive, royalty-free licence to use, reproduce, and display such content for marketing purposes.</li>
                </ul>
              </>
            ),
          },
          {
            id: "tc-9",
            num: "09",
            title: "User Conduct",
            content: (
              <>
                <p>By using our website, you agree not to:</p>
                <ul>
                  <li>Use the website for any unlawful purpose or in violation of these Terms.</li>
                  <li>Submit false, misleading, or fraudulent information.</li>
                  <li>Attempt to gain unauthorised access to any part of our website or systems.</li>
                  <li>Use automated tools (bots, scrapers) to access, extract, or index our content.</li>
                  <li>Post offensive, defamatory, or harmful content in reviews or communications.</li>
                  <li>Misuse our return policy (e.g. wardrobing — purchasing, wearing, and returning items).</li>
                </ul>
                <p>We reserve the right to block access to users who violate these conduct standards.</p>
              </>
            ),
          },
          {
            id: "tc-10",
            num: "10",
            title: "Limitation of Liability",
            content: (
              <>
                <p>To the maximum extent permitted by applicable law:</p>
                <ul>
                  <li>Our total liability to you for any claim arising out of or related to these Terms or your use of our website shall not exceed the amount you paid for the specific order giving rise to the claim.</li>
                  <li>We are not liable for indirect, incidental, special, consequential, or punitive damages.</li>
                  <li>We are not responsible for losses arising from force majeure events including natural disasters, pandemics, strikes, government actions, or internet outages.</li>
                  <li>We do not warrant that our website will be uninterrupted, error-free, or free of viruses.</li>
                </ul>
                <div className="legal-highlight">
                  ℹ️ Nothing in these terms limits liability for death, personal injury, or fraud caused by our negligence, as such limitation would be unlawful under Indian law.
                </div>
              </>
            ),
          },
          {
            id: "tc-11",
            num: "11",
            title: "Governing Law & Disputes",
            content: (
              <>
                <p>These Terms are governed by and construed in accordance with the laws of India, including the Consumer Protection Act, 2019, the Information Technology Act, 2000, and the Sale of Goods Act, 1930.</p>
                <p><strong>Dispute Resolution:</strong></p>
                <ol>
                  <li><strong>Informal Resolution:</strong> Please contact us at bespokewala@gmail.com before initiating formal proceedings. We aim to resolve disputes within 15 business days.</li>
                  <li><strong>Consumer Forum:</strong> If informal resolution fails, you may approach the Consumer Disputes Redressal Forum applicable to your jurisdiction under the Consumer Protection Act, 2019.</li>
                  <li><strong>Jurisdiction:</strong> For any dispute not resolved through the above, both parties agree to the exclusive jurisdiction of the courts located in <strong>Mumbai, Maharashtra, India</strong>.</li>
                </ol>
              </>
            ),
          },
          {
            id: "tc-12",
            num: "12",
            title: "Changes to Terms",
            content: (
              <p>We reserve the right to modify these Terms at any time. We will indicate the date of the most recent update at the top of this page. For material changes, we will provide notice via email to registered users. Your continued use of our website after changes are posted constitutes your acceptance of the revised Terms. We recommend reviewing this page periodically.</p>
            ),
          },
          {
            id: "tc-13",
            num: "13",
            title: "Contact Us",
            content: (
              <>
                <p>If you have any questions about these Terms &amp; Conditions, please reach us at:</p>
                <ul>
                  <li><strong>Email:</strong> bespokewala@gmail.com</li>
                  <li><strong>Phone / WhatsApp:</strong> +91 75067 67452</li>
                  <li><strong>Address:</strong> Lotus Arc One (Arc One) Building, Monginis Lane, Off New Link Road, Andheri West, Mumbai, Maharashtra – 400053</li>
                  <li><strong>Business Hours:</strong> Monday to Saturday, 10:00 AM – 8:00 PM IST</li>
                </ul>
              </>
            ),
          },
        ].map(({ id, num, title, content }) => (
          <section key={id} id={id} className="legal-section">
            <h2>
              <span className="sec-num">{num}</span>
              {title}
            </h2>
            {content}
          </section>
        ))}

        {/* Contact box */}
        <div className="legal-contact-box">
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#d2b48c", marginBottom: "0.75rem" }}>Questions?</p>
          <p style={{ fontSize: "0.95rem", fontWeight: 300, color: "#fff", marginBottom: "1rem" }}>
            Our team is happy to clarify any part of these terms.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a href="mailto:bespokewala@gmail.com" className="btn-primary" style={{ fontSize: "0.8rem" }}>Email Us</a>
            <Link href="/contact" className="btn-secondary" style={{ color: "#fff", borderColor: "#fff", fontSize: "0.8rem" }}>Contact Page →</Link>
          </div>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#bbb", marginTop: "2rem", textAlign: "center" }}>
          Also see: <Link href="/privacy-policy" style={{ color: "#d2b48c" }}>Privacy Policy</Link>
        </p>
      </div>
    </>
  );
}
