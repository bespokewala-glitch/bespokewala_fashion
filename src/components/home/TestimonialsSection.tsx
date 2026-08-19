'use client';

import React, { useState, useEffect } from 'react';

const testimonials = [
  {
    id: 1,
    text: "The craftsmanship and attention to detail are unparalleled. My bespoke lehenga was absolutely flawless.",
    author: "Priya S.",
    location: "Mumbai, India"
  },
  {
    id: 2,
    text: "Exceptional service from start to finish. The team understood exactly what I wanted for my wedding sherwani.",
    author: "Rahul M.",
    location: "London, UK"
  },
  {
    id: 3,
    text: "Wearing Bespokewala makes you feel like royalty. The fabrics, the fit, the embroidery—pure luxury.",
    author: "Ayesha K.",
    location: "Dubai, UAE"
  }
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="testimonials-section">
      <style>{`
        .testimonials-section {
          background-color: #111;
          color: #fff;
          padding: 6rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .testimonials-header {
          font-size: 0.85rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #d2b48c;
          margin-bottom: 3rem;
        }
        .testimonial-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          min-height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .testimonial-slide {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.8s ease, visibility 0.8s ease, transform 0.8s ease;
        }
        .testimonial-slide.active {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, -50%) scale(1);
        }
        .testimonial-slide.inactive {
          transform: translate(-50%, -50%) scale(0.95);
        }
        .testimonial-text {
          font-size: clamp(1.2rem, 3vw, 1.8rem);
          font-weight: 300;
          line-height: 1.6;
          font-style: italic;
          margin-bottom: 2rem;
          color: #f8f8f8;
        }
        .testimonial-author {
          font-size: 0.9rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
          color: #d2b48c;
        }
        .testimonial-location {
          font-size: 0.75rem;
          color: #888;
          margin-top: 0.5rem;
        }
        .testimonial-indicators {
          display: flex;
          gap: 12px;
          margin-top: 2rem;
        }
        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #444;
          cursor: pointer;
          transition: background-color 0.3s ease;
          border: none;
          padding: 0;
        }
        .indicator-dot.active {
          background-color: #d2b48c;
        }
        
        @media (max-width: 768px) {
          .testimonials-section {
            padding: 4rem 1.5rem;
          }
          .testimonial-container {
            min-height: 280px;
          }
          .testimonial-text {
            font-size: 1.25rem;
          }
        }
      `}</style>

      <div className="testimonials-header">Client Testimonials</div>

      <div className="testimonial-container">
        {testimonials.map((t, index) => (
          <div 
            key={t.id} 
            className={`testimonial-slide ${index === activeIndex ? 'active' : 'inactive'}`}
            aria-hidden={index !== activeIndex}
          >
            <div className="testimonial-text">"{t.text}"</div>
            <div className="testimonial-author">{t.author}</div>
            <div className="testimonial-location">{t.location}</div>
          </div>
        ))}
      </div>

      <div className="testimonial-indicators">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={`indicator-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
