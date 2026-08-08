/* Pure server component — no useState/useEffect, no hydration risk */

import React from 'react';
import Link from 'next/link';

const LAST_UPDATED = "1 August 2026";

export default function PrivacyPolicyContent() {
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
        }
        .legal-section p { font-size: 0.9rem; color: #444; line-height: 1.9; margin-bottom: 0.9rem; }
        .legal-section ul { margin: 0.5rem 0 0.9rem 1.5rem; padding: 0; }
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
          Privacy Policy
        </h1>
        <div style={{ width: "60px", height: "1px", backgroundColor: "#d2b48c", margin: "0 auto 1.25rem" }} />
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
          Last updated: {LAST_UPDATED}
        </p>
      </section>

      {/* ── BODY ── */}
      <div className="legal-body">

        {/* Intro */}
        <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: 1.9, marginBottom: "2rem" }}>
          Bespoken Fashion (&ldquo;Bespokewala&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website{" "}
          <strong>www.bespokewala.com</strong> and make purchases from us. Please read it carefully.
          By using our website, you consent to the practices described in this policy.
        </p>

        {/* Table of Contents */}
        <div className="legal-toc">
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d2b48c", fontWeight: 600 }}>
            Table of Contents
          </p>
          <ol>
            {[
              "Information We Collect",
              "How We Use Your Information",
              "Sharing Your Information",
              "Cookies & Tracking Technologies",
              "Data Retention",
              "Your Rights",
              "Data Security",
              "Third-Party Links",
              "Children's Privacy",
              "Changes to This Policy",
              "Contact Us",
            ].map((item, i) => (
              <li key={i}><a href={`#pp-${i + 1}`}>{item}</a></li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        {[
          {
            id: "pp-1",
            num: "01",
            title: "Information We Collect",
            content: (
              <>
                <p>We collect information you provide directly to us, as well as data collected automatically when you use our website.</p>
                <p><strong>Information You Provide:</strong></p>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, password when you create an account.</li>
                  <li><strong>Order Information:</strong> Billing address, shipping address, phone number, payment details (processed securely — we do not store full card numbers).</li>
                  <li><strong>Measurement Data:</strong> Body measurements you provide for custom/bespoke orders.</li>
                  <li><strong>Communications:</strong> Messages you send us via email, WhatsApp, or contact forms.</li>
                  <li><strong>Marketing Preferences:</strong> Whether you opt in to newsletters and promotional communications.</li>
                </ul>
                <p><strong>Information Collected Automatically:</strong></p>
                <ul>
                  <li>IP address, browser type, operating system, referring URLs.</li>
                  <li>Pages visited, time spent, links clicked on our website.</li>
                  <li>Device identifiers and session data.</li>
                  <li>Cookie data (see Section 4).</li>
                </ul>
              </>
            ),
          },
          {
            id: "pp-2",
            num: "02",
            title: "How We Use Your Information",
            content: (
              <>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Process and fulfil your orders, including sending order confirmations, invoices, and shipping updates.</li>
                  <li>Create and manage your account.</li>
                  <li>Respond to your enquiries, complaints, and customer service requests.</li>
                  <li>Craft custom garments using your measurement data.</li>
                  <li>Send promotional emails and newsletters — only if you have opted in.</li>
                  <li>Personalise your shopping experience and recommend relevant products.</li>
                  <li>Prevent fraud and ensure the security of our platform.</li>
                  <li>Comply with legal obligations under Indian law (GST, consumer protection, etc.).</li>
                  <li>Improve our website, products, and services through analytics.</li>
                </ul>
              </>
            ),
          },
          {
            id: "pp-3",
            num: "03",
            title: "Sharing Your Information",
            content: (
              <>
                <p>We do <strong>not</strong> sell, rent, or trade your personal information to third parties for their marketing purposes. We share data only in the following circumstances:</p>
                <ul>
                  <li><strong>Service Providers:</strong> Courier partners (Blue Dart, Delhivery, FedEx, DHL), payment gateways (Razorpay / PayU), email service providers, and cloud hosting providers who process data on our behalf under strict data agreements.</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority under the laws of India.</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred. We will notify you before this occurs.</li>
                  <li><strong>With Your Consent:</strong> For any other purpose with your explicit prior consent.</li>
                </ul>
                <div className="legal-highlight">
                  🔒 All our third-party service providers are contractually obligated to keep your information confidential and use it solely to provide services on our behalf.
                </div>
              </>
            ),
          },
          {
            id: "pp-4",
            num: "04",
            title: "Cookies & Tracking Technologies",
            content: (
              <>
                <p>We use cookies and similar technologies to enhance your browsing experience. Types of cookies we use:</p>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for the website to function (e.g. shopping cart, login session). Cannot be disabled.</li>
                  <li><strong>Analytics Cookies:</strong> Google Analytics — help us understand how visitors use our site. Data is anonymised.</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings (e.g. currency, language).</li>
                  <li><strong>Marketing Cookies:</strong> Used to show you relevant advertisements on third-party platforms (e.g. Instagram, Google Ads). Only active if you have accepted marketing cookies.</li>
                </ul>
                <p>You can control cookie preferences in your browser settings. Disabling essential cookies may affect website functionality.</p>
              </>
            ),
          },
          {
            id: "pp-5",
            num: "05",
            title: "Data Retention",
            content: (
              <>
                <p>We retain your personal data for as long as necessary to fulfil the purposes outlined in this policy, including:</p>
                <ul>
                  <li><strong>Account Data:</strong> Retained for the lifetime of your account, plus 2 years after account closure.</li>
                  <li><strong>Order Data:</strong> Retained for 7 years as required under Indian GST and tax regulations.</li>
                  <li><strong>Measurement Data:</strong> Retained until you request deletion or 3 years after last order, whichever is sooner.</li>
                  <li><strong>Marketing Data:</strong> Retained until you unsubscribe.</li>
                </ul>
                <p>After retention periods expire, data is securely deleted or anonymised.</p>
              </>
            ),
          },
          {
            id: "pp-6",
            num: "06",
            title: "Your Rights",
            content: (
              <>
                <p>Under the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (DPDP Act), you have the following rights:</p>
                <ul>
                  <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
                  <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention obligations).</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications at any time.</li>
                  <li><strong>Right to Grievance Redressal:</strong> Raise a complaint with our Data Protection Officer.</li>
                </ul>
                <p>To exercise any of these rights, email us at <strong>bespokewala@gmail.com</strong> with the subject &ldquo;Data Rights Request&rdquo;. We will respond within 30 days.</p>
              </>
            ),
          },
          {
            id: "pp-7",
            num: "07",
            title: "Data Security",
            content: (
              <>
                <p>We implement industry-standard security measures to protect your personal information:</p>
                <ul>
                  <li>256-bit SSL/TLS encryption for all data transmitted to and from our website.</li>
                  <li>PCI-DSS compliant payment processing — we never store full card numbers on our servers.</li>
                  <li>Access controls ensuring only authorised staff can access personal data.</li>
                  <li>Regular security audits and vulnerability assessments.</li>
                  <li>Secure, encrypted cloud storage for all personal data.</li>
                </ul>
                <p>While we take every precaution, no method of internet transmission is 100% secure. In the event of a data breach affecting your rights, we will notify you as required by law within 72 hours.</p>
              </>
            ),
          },
          {
            id: "pp-8",
            num: "08",
            title: "Third-Party Links",
            content: (
              <p>Our website may contain links to third-party websites (e.g. courier tracking portals, social media platforms). We are not responsible for the privacy practices of these sites. We encourage you to read their privacy policies before providing any personal information.</p>
            ),
          },
          {
            id: "pp-9",
            num: "09",
            title: "Children's Privacy",
            content: (
              <p>Our website is not directed to individuals under the age of 18. We do not knowingly collect personal data from children. If we become aware that a child under 18 has provided us with personal data, we will delete it immediately. If you believe we have inadvertently collected such data, contact us at bespokewala@gmail.com.</p>
            ),
          },
          {
            id: "pp-10",
            num: "10",
            title: "Changes to This Policy",
            content: (
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by posting the updated policy on this page and updating the &ldquo;Last Updated&rdquo; date at the top. For significant changes, we will also send an email notification to registered users. Your continued use of our website after changes are posted constitutes your acceptance of the revised policy.</p>
            ),
          },
          {
            id: "pp-11",
            num: "11",
            title: "Contact Us",
            content: (
              <>
                <p>For any privacy-related queries, concerns, or to exercise your data rights, please contact our Data Protection Officer:</p>
                <ul>
                  <li><strong>Email:</strong> bespokewala@gmail.com</li>
                  <li><strong>Phone / WhatsApp:</strong> +91 75067 67452</li>
                  <li><strong>Address:</strong> Lotus Arc One (Arc One) Building, Monginis Lane, Off New Link Road, Andheri West, Mumbai, Maharashtra – 400053</li>
                </ul>
                <p>We are committed to working with you to resolve any concern regarding your privacy.</p>
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
            We&apos;re committed to being transparent about how we handle your data.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a href="mailto:bespokewala@gmail.com" className="btn-primary" style={{ fontSize: "0.8rem" }}>Email Us</a>
            <Link href="/contact" className="btn-secondary" style={{ color: "#fff", borderColor: "#fff", fontSize: "0.8rem" }}>Contact Page →</Link>
          </div>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#bbb", marginTop: "2rem", textAlign: "center" }}>
          Also see: <Link href="/terms-conditions" style={{ color: "#d2b48c" }}>Terms &amp; Conditions</Link>
        </p>
      </div>
    </>
  );
}
