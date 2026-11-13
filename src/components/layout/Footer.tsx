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
