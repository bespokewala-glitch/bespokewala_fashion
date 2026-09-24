"use client";

import React from 'react';
import Link from 'next/link';
import { useCookieConsent } from '@/context/CookieConsentContext';
import CookiePreferencesModal from '@/components/CookieConsent/CookiePreferencesModal';

export default function Footer() {
  const { openPreferences, isPreferencesOpen } = useCookieConsent();

  const footerStyle: React.CSSProperties = {
    backgroundColor: '#1c1c1c',
    color: '#fff',
    padding: '4rem 2rem',
    marginTop: 'auto',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '1200px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '2rem',
  };

  const columnStyle: React.CSSProperties = {
    flex: '1',
    minWidth: '160px',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '1.5rem',
    color: '#d2b48c',
  };

  const listStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '0.875rem',
    lineHeight: '2',
    color: '#ccc',
  };

  const bottomBar: React.CSSProperties = {
    marginTop: '4rem',
    paddingTop: '2rem',
    borderTop: '1px solid #333',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#999',
    letterSpacing: '0.05em',
  };

  return (
    <>
      {/* Render the preferences modal when opened from the footer */}
      {isPreferencesOpen && <CookiePreferencesModal />}

      <footer style={footerStyle} className="mobile-section-py mobile-px-container">
        <div style={containerStyle} className="mobile-stack">
          <div style={columnStyle}>
            <p style={headingStyle}>Company</p>
            <ul style={listStyle}>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/press">Press</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          
          <div style={columnStyle}>
            <p style={headingStyle}>Customer Care</p>
            <ul style={listStyle}>
              <li><Link href="/shipping">Shipping &amp; Returns</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/track-order">Track Order</Link></li>
              <li><Link href="/size-guide">Size Guide</Link></li>
            </ul>
          </div>

          <div style={columnStyle}>
            <p style={headingStyle}>Shop</p>
            <ul style={listStyle}>
              <li><Link href="/products/couture">Couture</Link></li>
              <li><Link href="/products/jewellery">Jewellery</Link></li>
              <li><Link href="/products/footwear">Footwear</Link></li>
            </ul>
          </div>

          <div style={columnStyle}>
            <p style={headingStyle}>Legal</p>
            <ul style={listStyle}>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms-conditions">Terms &amp; Conditions</Link></li>
              <li>
                <button
                  onClick={openPreferences}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    color: '#ccc',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    lineHeight: '2',
                    letterSpacing: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>

          <div style={columnStyle}>
            <p style={headingStyle}>Contact Us</p>
            <ul style={listStyle}>
              <li style={{ color: '#ccc', fontSize: '0.875rem', lineHeight: '1.6' }}>
                General: <a href="mailto:info@bespokewala.com" style={{ color: '#ccc', textDecoration: 'none' }}>info@bespokewala.com</a><br/>
                Sales: <a href="mailto:sales@bespokewala.com" style={{ color: '#ccc', textDecoration: 'none' }}>sales@bespokewala.com</a><br/>
                Phone: <a href="tel:+917506767452" style={{ color: '#ccc', textDecoration: 'none' }}>+91 75067 67452</a><br/><br/>
                Lotus Arc One, Monginis Lane<br/>Andheri West, Mumbai 400053
              </li>
            </ul>
          </div>

          <div style={columnStyle} className="mobile-footer-full">
            <p style={headingStyle}>Newsletter</p>
            <p style={{ fontSize: '0.875rem', color: '#ccc', marginBottom: '1rem' }}>
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form style={{ display: 'flex' }} className="mobile-flex-col mobile-gap-sm">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                style={{
                  padding: '0.75rem',
                  flex: '1',
                  border: '1px solid #333',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <button type="submit" style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fff',
                color: '#1c1c1c',
                border: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}>Subscribe</button>
            </form>
            <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.75rem', lineHeight: 1.6 }}>
              By subscribing you agree to receive marketing emails from Bespokewala. You can unsubscribe at any time. View our{' '}
              <Link href="/privacy-policy" style={{ color: '#d2b48c', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          </div>
        </div>
        
        <div style={bottomBar}>
          &copy; {new Date().getFullYear()} Bespokewala. All Rights Reserved.
        </div>
      </footer>
    </>
  );
}
