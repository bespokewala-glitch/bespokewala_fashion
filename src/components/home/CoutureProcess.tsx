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
    <section style={{ backgroundColor: '#faf8f5', display: 'flex', flexWrap: 'wrap', minHeight: '80vh', marginTop: '6rem' }}>
      {/* Left Column - Accordion */}
      <div style={{ flex: '1 1 50%', padding: '6rem 4rem', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '4rem', textTransform: 'uppercase', color: '#333' }}>
          The Couture<br/>Process
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
          {steps.map((step: any, index: number) => {
            const isActive = index === activeIndex;
            return (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: isActive ? '#f0ede6' : 'transparent',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                <div 
                  onClick={() => setActiveIndex(index)}
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 400, color: '#333' }}>
                    {step.title}
                  </h3>
                  <span style={{ 
                    transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s ease',
                    fontSize: '0.8rem',
                    color: '#666'
                  }}>
                    &#9660;
                  </span>
                </div>
                
                <div style={{ 
                  maxHeight: isActive ? '500px' : '0px', 
                  opacity: isActive ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.4s ease-in-out',
                  padding: isActive ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem',
                  marginTop: isActive ? '1rem' : '0',
                }}>
                  <p style={{ margin: 0, color: '#555', lineHeight: '1.6', fontSize: '0.95rem' }}>
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
