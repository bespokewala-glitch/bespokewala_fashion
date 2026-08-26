'use client';

import React from 'react';
import Link from 'next/link';

export default function ConsultationPage() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#3d352e' }}>Virtual Consultation</h1>
      <p style={{ fontSize: '1.2rem', color: '#5a4e47', maxWidth: '600px', marginBottom: '2rem' }}>
        Book a one-on-one virtual session with our expert stylists. We'll guide you through taking your exact measurements at home and discuss bespoke options tailored specifically to your style and occasion.
      </p>
      
      <div style={{ padding: '2rem', border: '1px solid #e0dcd9', borderRadius: '8px', backgroundColor: '#fcfbf9', maxWidth: '500px', width: '100%' }}>
        <h3 style={{ marginBottom: '1rem', color: '#3d352e' }}>Available Sessions</h3>
        <p style={{ marginBottom: '1.5rem', color: '#5a4e47' }}>Our stylists are available Monday through Saturday, 10 AM to 7 PM IST.</p>
        
        <a 
          href="https://wa.me/917506767452?text=I%20would%20like%20to%20book%20a%20virtual%20consultation"
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            backgroundColor: '#3d352e', 
            color: 'white', 
            border: 'none', 
            padding: '0.8rem 2rem', 
            fontSize: '1rem',
            cursor: 'pointer',
            borderRadius: '4px',
            marginBottom: '1rem',
            width: '100%',
            display: 'inline-block',
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box'
          }}
        >
          Book Appointment via WhatsApp
        </a>
        
        <div style={{ marginTop: '1rem' }}>
          <Link href="/" style={{ color: '#5a4e47', textDecoration: 'underline', fontSize: '0.9rem' }}>
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
