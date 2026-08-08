import React from 'react';
import Link from 'next/link';

export default function Footer() {
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
    minWidth: '200px',
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
    <footer style={footerStyle} className="mobile-section-py mobile-px-container">
      <div style={containerStyle} className="mobile-footer-grid">
        <div style={columnStyle}>
          <h4 style={headingStyle}>Company</h4>
          <ul style={listStyle}>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/press">Press</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        
        <div style={columnStyle}>
          <h4 style={headingStyle}>Customer Care</h4>
          <ul style={listStyle}>
            <li><Link href="/shipping">Shipping & Returns</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/track-order">Track Order</Link></li>
            <li><Link href="/size-guide">Size Guide</Link></li>
          </ul>
        </div>

        <div style={columnStyle}>
          <h4 style={headingStyle}>Legal</h4>
          <ul style={listStyle}>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms-conditions">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div style={columnStyle} className="mobile-footer-full">
          <h4 style={headingStyle}>Newsletter</h4>
          <p style={{ fontSize: '0.875rem', color: '#ccc', marginBottom: '1rem' }}>
            Subscribe to receive updates, access to exclusive deals, and more.
          </p>
          <form style={{ display: 'flex' }}>
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
        </div>
      </div>
      
      <div style={bottomBar}>
        &copy; {new Date().getFullYear()} Bespokewala. All Rights Reserved.
      </div>
    </footer>
  );
}
