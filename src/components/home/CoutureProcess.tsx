"use client";

import React, { useState } from 'react';

export default function CoutureProcess({ data }: { data?: any }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fallback data if none is provided via CMS
  const defaultSteps = [
    {
      title: "Initial Consultation",
      description: "The first step to your couture order is the consultation where you will be meeting with a Client Relations specialist by appointment at any of our flagship stores in Delhi, Mumbai or Hyderabad and even Online. In this meeting we will discuss the purpose of your order in detail.",
      media: "https://videos.pexels.com/video-files/5826048/5826048-uhd_2732_1440_24fps.mp4",
      enabled: true
    },
    {
      title: "Measurements",
      description: "Once the design is finalized, our master tailors will take your precise measurements to ensure a flawless fit.",
      media: "https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&q=80",
      enabled: true
    },
    {
      title: "Design Process",
      description: "Our artisans begin crafting your garment, paying close attention to every detail, embroidery, and fabric choice.",
      media: "https://videos.pexels.com/video-files/5825700/5825700-uhd_2732_1440_24fps.mp4",
      enabled: true
    }
  ];

  const fallbackMedia = "https://videos.pexels.com/video-files/5826048/5826048-uhd_2732_1440_24fps.mp4";

  const steps = data?.steps && data.steps.length > 0 ? data.steps.filter((s: any) => s.enabled) : defaultSteps;

  if (steps.length === 0) return null;

  const activeStep = steps[activeIndex] || steps[0];

  const isVideo = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) != null;
  };

  return (
    <section style={{ backgroundColor: '#faf8f5', display: 'flex', flexWrap: 'wrap', minHeight: '80vh', marginTop: '6rem' }} className="mobile-flex-col mobile-m-0">
      {/* Left Column - Accordion */}
      <div style={{ flex: '1 1 50%', padding: '6rem 4rem', boxSizing: 'border-box' }} className="mobile-section-py mobile-px-container">
        <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '4rem', textTransform: 'uppercase', color: '#333' }} className="mobile-h2-clamp mobile-section-mb">
          The Couture<br/>Process
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }} className="mobile-gap-sm">
          {steps.map((step: any, index: number) => {
            const isActive = index === activeIndex;
            return (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: 'transparent',
                  borderBottom: '1px solid #e0e0e0',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                <div 
                  onClick={() => setActiveIndex(index)}
                  style={{
                    padding: '1.25rem 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  className="mobile-py-2"
                >
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: isActive ? 500 : 400, color: isActive ? '#000' : '#444' }} className="mobile-h3-clamp">
                    {step.title}
                  </h3>
                  <span style={{ 
                    transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s ease',
                    fontSize: '0.8rem',
                    color: isActive ? '#000' : '#888'
                  }}>
                    &#9660;
                  </span>
                </div>
                
                <div style={{ 
                  maxHeight: isActive ? '500px' : '0px', 
                  opacity: isActive ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.4s ease-in-out',
                  padding: isActive ? '0 0 1.25rem 0' : '0',
                }}
                className={isActive ? 'mobile-pb-4' : ''}>
                  <p style={{ margin: 0, color: '#555', lineHeight: '1.6', fontSize: '0.95rem' }} className="mobile-body-clamp">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column - Media */}
      <div style={{ flex: '1 1 50%', position: 'relative', minHeight: '400px' }}>
        {(data?.mainMedia || data?.image || fallbackMedia) && (
          <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            {isVideo(data?.mainMedia || data?.image || fallbackMedia) ? (
              <video 
                src={data?.mainMedia || data?.image || fallbackMedia} 
                autoPlay 
                loop 
                muted 
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img 
                src={data?.mainMedia || data?.image || fallbackMedia} 
                alt="Couture Process" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
