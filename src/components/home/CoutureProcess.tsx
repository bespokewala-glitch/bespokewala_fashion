"use client";

import React from 'react';

export default function CoutureProcess({ data }: { data?: any }) {
  // Fallback data if none is provided via CMS
  const defaultSteps = [
    {
      title: "Design Consultation",
      description: "Discuss your vision, occasion, style preferences, and customization requirements with our design experts.",
      image: "https://images.unsplash.com/photo-1558769132-cb1fac0850f9?auto=format&fit=crop&q=80&w=800",
      enabled: true
    },
    {
      title: "Fabric & Craft Selection",
      description: "Select premium fabrics, embroidery techniques, embellishments, and handcrafted details for your couture piece.",
      image: "https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&q=80&w=800",
      enabled: true
    },
    {
      title: "Tailoring & Handcrafting",
      description: "Our skilled artisans carefully cut, stitch, and handcraft every detail to create a perfectly fitted masterpiece.",
      image: "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&q=80&w=800",
      enabled: true
    },
    {
      title: "Final Fitting & Delivery",
      description: "After a final quality check and fitting, your couture creation is beautifully packaged and delivered.",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800",
      enabled: true
    }
  ];

  const steps = data?.steps && Array.isArray(data.steps) && data.steps.length >= 4 
    ? data.steps.filter((s: any) => s.enabled) 
    : defaultSteps;

  if (steps.length === 0) return null;

  return (
    <section id="couture-process" style={{ backgroundColor: '#faf8f5', padding: '6rem 2rem' }} className="mobile-section-py mobile-px-container">
      <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase', color: '#111' }} className="mobile-h2-clamp">
          The Couture Process
        </h2>
        <p style={{ color: '#555', maxWidth: '600px', margin: '0 auto 4rem auto', fontSize: '1rem', lineHeight: '1.6' }} className="mobile-body-clamp mobile-mb-4">
          Experience the journey of creating your bespoke masterpiece, from the first sketch to the final fitting.
        </p>

        <style>{`
          .process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 2rem;
          }
          .process-step-card {
            display: flex;
            flex-direction: column;
            text-align: left;
          }
          .process-image-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 125%; /* 4:5 aspect ratio */
            overflow: hidden;
            margin-bottom: 1.5rem;
            background-color: #eee;
          }
          .process-image-wrapper img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.7s ease;
          }
          .process-step-card:hover .process-image-wrapper img {
            transform: scale(1.05);
          }
          .process-step-number {
            font-size: 0.85rem;
            letter-spacing: 0.15em;
            color: #888;
            margin-bottom: 0.5rem;
            display: block;
          }
          .process-step-title {
            font-size: 1.2rem;
            font-weight: 400;
            color: #111;
            margin-bottom: 1rem;
            letter-spacing: 0.05em;
          }
          .process-step-desc {
            font-size: 0.9rem;
            color: #666;
            line-height: 1.6;
          }
          @media (max-width: 1024px) {
            .process-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 3rem 2rem;
            }
          }
          @media (max-width: 768px) {
            .process-grid {
              grid-template-columns: 1fr;
              gap: 2.5rem;
            }
            .process-image-wrapper {
              padding-bottom: 100%; /* 1:1 on mobile */
            }
          }
        `}</style>

        <div className="process-grid">
          {steps.map((step: any, index: number) => (
            <div key={index} className="process-step-card">
              <div className="process-image-wrapper">
                <img src={step.image || step.media || defaultSteps[index]?.image} alt={step.title} loading="lazy" />
              </div>
              <div>
                <span className="process-step-number">STEP 0{index + 1}</span>
                <h3 className="process-step-title">{step.title}</h3>
                <p className="process-step-desc">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '5rem', textAlign: 'center' }}>
          <a 
            href="/contact" 
            className="btn-primary" 
            style={{ 
              display: 'inline-block',
              padding: '1rem 2.5rem',
              backgroundColor: '#1c1c1c',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              transition: 'background-color 0.3s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d2b48c'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1c1c1c'}
          >
            Book a Consultation
          </a>
        </div>
      </div>
    </section>
  );
}
