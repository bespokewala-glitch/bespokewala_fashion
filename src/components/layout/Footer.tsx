"use client";

import React from 'react';
import Link from 'next/link';
import { useCookieConsent } from '@/context/CookieConsentContext';
import CookiePreferencesModal from '@/components/CookieConsent/CookiePreferencesModal';

export default function Footer() {
  const { openPreferences, isPreferencesOpen } = useCookieConsent();

  return (
    <>
      {/* Render the preferences modal when opened from the footer */}
      {isPreferencesOpen && <CookiePreferencesModal />}

      <footer className="site-footer">
        <style>{`
          .site-footer {
            background-color: #171717;
            color: #fff;
            padding: 4.5rem 2rem 2.5rem;
            margin-top: auto;
            border-top: 1px solid #262626;
            font-family: inherit;
          }
          .footer-container {
            max-width: 1280px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, 1fr) 1.25fr 1.5fr;
            gap: 2.5rem 2rem;
          }
          .footer-col {
            display: flex;
            flex-direction: column;
          }
          .footer-heading {
            font-size: 0.8rem;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            margin-bottom: 1.25rem;
            color: #d2b48c;
            font-weight: 600;
          }
          .footer-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .footer-list li {
            display: flex;
            align-items: center;
          }
          .footer-link {
            color: #b3b3b3;
            font-size: 0.825rem;
            text-decoration: none;
            transition: color 0.2s ease, transform 0.2s ease;
            display: inline-block;
            padding: 0.35rem 0;
            letter-spacing: 0.03em;
            width: 100%;
          }
          .footer-link:hover {
            color: #ffffff;
            transform: translateX(2px);
          }
          .footer-contact-item {
            color: #b3b3b3;
            font-size: 0.825rem;
            line-height: 1.7;
          }
          .footer-contact-link {
            color: #e0e0e0;
            text-decoration: none;
            transition: color 0.2s ease;
            display: inline-block;
            padding: 2px 0;
          }
          .footer-contact-link:hover {
            color: #d2b48c;
            text-decoration: underline;
          }
          .footer-newsletter-desc {
            font-size: 0.825rem;
            color: #b3b3b3;
            margin-bottom: 1.25rem;
            line-height: 1.6;
          }
          .footer-newsletter-form {
            display: flex;
            gap: 0.5rem;
            width: 100%;
          }
          .footer-input {
            padding: 0.85rem 1rem;
            flex: 1;
            border: 1px solid #383838;
            background-color: #222222;
            color: #fff;
            outline: none;
            font-size: 16px; /* Prevents iOS auto-zoom on focus */
            border-radius: 4px;
            font-family: inherit;
            min-height: 48px;
            box-sizing: border-box;
            transition: border-color 0.2s, background-color 0.2s;
          }
          .footer-input:focus {
            border-color: #d2b48c;
            background-color: #282828;
          }
          .footer-submit-btn {
            padding: 0.85rem 1.5rem;
            background-color: #d2b48c;
            color: #171717;
            border: none;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 4px;
            min-height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease, transform 0.15s ease;
            white-space: nowrap;
          }
          .footer-submit-btn:hover {
            background-color: #e5cb9f;
            transform: translateY(-1px);
          }
          .footer-privacy-notice {
            font-size: 0.72rem;
            color: #888;
            margin-top: 0.75rem;
            line-height: 1.6;
          }
          .footer-bottom-bar {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #282828;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.75rem;
            color: #777;
            letter-spacing: 0.05em;
            max-width: 1280px;
            margin-left: auto;
            margin-right: auto;
          }
          .footer-brand-logo {
            font-size: 0.9rem;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #999;
          }

          /* Tablet Breakpoint (640px to 1024px) */
          @media (max-width: 1024px) and (min-width: 640px) {
            .site-footer {
              padding: 3.5rem 2rem 2rem;
            }
            .footer-container {
              grid-template-columns: repeat(3, 1fr);
              gap: 2.5rem 1.5rem;
            }
            .footer-col-newsletter {
              grid-column: 1 / -1;
              max-width: 520px;
            }
          }

          /* Small Screen / Mobile Breakpoint (< 640px) */
          @media (max-width: 639px) {
            .site-footer {
              padding: 2.75rem 1.25rem 2rem;
            }
            .footer-container {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 2.25rem 1.25rem !important;
            }
            .footer-col-shop {
              order: 1;
            }
            .footer-col-care {
              order: 2;
            }
            .footer-col-company {
              order: 3;
            }
            .footer-col-legal {
              order: 4;
            }
            .footer-col-contact {
              order: 5;
              grid-column: 1 / -1 !important;
              padding-top: 1.5rem;
              border-top: 1px solid #262626;
            }
            .footer-col-newsletter {
              order: 6;
              grid-column: 1 / -1 !important;
              padding-top: 1.5rem;
              border-top: 1px solid #262626;
            }
            .footer-newsletter-form {
              flex-direction: column !important;
              gap: 0.75rem !important;
            }
            .footer-submit-btn {
              width: 100% !important;
            }
            .footer-bottom-bar {
              margin-top: 2.5rem;
              padding-top: 1.5rem;
              flex-direction: column;
              gap: 0.75rem;
              text-align: center;
            }
            .footer-link {
              padding: 0.5rem 0; /* Ensures generous touch target */
              min-height: 40px;
              display: flex;
              align-items: center;
            }
          }
        `}</style>

        <div className="footer-container">
          {/* Shop Column */}
          <div className="footer-col footer-col-shop">
            <h4 className="footer-heading">Shop</h4>
            <ul className="footer-list">
              <li><Link href="/products/couture" className="footer-link">Couture</Link></li>
              <li><Link href="/products/jewellery" className="footer-link">Jewellery</Link></li>
              <li><Link href="/products/accessories" className="footer-link">Accessories</Link></li>
              <li><Link href="/products/footwear" className="footer-link">Footwear</Link></li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div className="footer-col footer-col-care">
            <h4 className="footer-heading">Customer Care</h4>
            <ul className="footer-list">
              <li><Link href="/shipping" className="footer-link">Shipping &amp; Returns</Link></li>
              <li><Link href="/faq" className="footer-link">FAQ</Link></li>
              <li><Link href="/track-order" className="footer-link">Track Order</Link></li>
              <li><Link href="/size-guide" className="footer-link">Size Guide</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="footer-col footer-col-company">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-list">
              <li><Link href="/about" className="footer-link">About Us</Link></li>
              <li><Link href="/press" className="footer-link">Press</Link></li>
              <li><Link href="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="footer-col footer-col-legal">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-list">
              <li><Link href="/privacy-policy" className="footer-link">Privacy Policy</Link></li>
              <li><Link href="/terms-conditions" className="footer-link">Terms &amp; Conditions</Link></li>
              <li>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="footer-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    margin: 0,
                    cursor: 'pointer',
                    letterSpacing: 'inherit',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div className="footer-col footer-col-contact">
            <h4 className="footer-heading">Contact Us</h4>
            <div className="footer-contact-item">
              <div>
                General: <a href="mailto:info@bespokewala.com" className="footer-contact-link">info@bespokewala.com</a>
              </div>
              <div>
                Sales: <a href="mailto:sales@bespokewala.com" className="footer-contact-link">sales@bespokewala.com</a>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                Phone: <a href="tel:+917506767452" className="footer-contact-link">+91 75067 67452</a>
              </div>
              <div style={{ marginTop: '0.6rem', color: '#999', fontSize: '0.8rem', lineHeight: '1.5' }}>
                Lotus Arc One, Monginis Lane<br />
                Andheri West, Mumbai 400053
              </div>
            </div>
          </div>

          {/* Newsletter Column */}
          <div className="footer-col footer-col-newsletter">
            <h4 className="footer-heading">Newsletter</h4>
            <p className="footer-newsletter-desc">
              Subscribe to receive private updates, seasonal trunk shows, and exclusive bespoke collections.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                required
                className="footer-input"
                aria-label="Email address for newsletter"
              />
              <button type="submit" className="footer-submit-btn">
                Subscribe
              </button>
            </form>
            <p className="footer-privacy-notice">
              By subscribing you agree to receive updates from Bespokewala. View our{' '}
              <Link href="/privacy-policy" style={{ color: '#d2b48c', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-brand-logo">Bespokewala</div>
          <div>&copy; {new Date().getFullYear()} Bespokewala. All Rights Reserved.</div>
        </div>
      </footer>
    </>
  );
}
