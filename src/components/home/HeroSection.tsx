"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Campaign {
  _id?: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  linkUrl: string;
}

interface HeroSectionProps {
  campaigns?: Campaign[];
}

export default function HeroSection({ campaigns = [] }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fallbackCampaigns: Campaign[] = [
    { title: 'The Bridal Edit', subtitle: 'New Collection', videoUrl: '/clothures_video.mp4', linkUrl: '/products?productType=couture' },
    { title: 'High Jewellery', subtitle: 'Signature', videoUrl: '/jwellay_video.mp4', linkUrl: '/products?productType=jewellery' },
    { title: 'Accessories', subtitle: 'Essentials', videoUrl: '/accessary_video.mp4', linkUrl: '/products?productType=pret' }
  ];

  const activeCampaigns = campaigns && campaigns.length > 0 ? campaigns : fallbackCampaigns;
  const currentCampaign = activeCampaigns[currentIndex];

  const handleVideoEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isImg = activeCampaigns[currentIndex]?.videoUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    
    if (isImg) {
      timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length);
      }, 5000);
    } else if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentIndex, activeCampaigns]);

  const heroStyle: React.CSSProperties = {
    position: 'relative',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    backgroundColor: '#000',
  };

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '2rem',
    fontWeight: 300,
    cursor: 'pointer',
    padding: '2rem',
    opacity: 0.7,
    transition: 'opacity 0.3s ease',
  };

  const videoStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    filter: 'brightness(0.7)',
    transition: 'opacity 0.5s ease-in-out',
  };

  const overlayContentStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '4rem',
    left: '4rem',
    zIndex: 1,
    textAlign: 'left',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1rem',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '3.5rem',
    fontWeight: 300,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    margin: 0,
  };

  const isImage = currentCampaign?.videoUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;

  return (
    <section style={heroStyle}>
      {isImage ? (
        <img 
          src={currentCampaign?.videoUrl}
          style={videoStyle}
          alt={currentCampaign?.title}
        />
      ) : (
        <video 
          ref={videoRef}
          src={currentCampaign?.videoUrl}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          style={videoStyle}
        />
      )}
      
      <button 
        onClick={() => setCurrentIndex((prev) => (prev - 1 + activeCampaigns.length) % activeCampaigns.length)}
        style={{ ...arrowStyle, left: '1rem' }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        &#10094;
      </button>
      <button 
        onClick={() => setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length)}
        style={{ ...arrowStyle, right: '1rem' }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        &#10095;
      </button>

      <div style={overlayContentStyle}>
        <div style={subtitleStyle}>{currentCampaign?.subtitle}</div>
        <h1 style={titleStyle}>{currentCampaign?.title}</h1>
        {currentCampaign?.linkUrl && (
          <Link href={currentCampaign.linkUrl} className="btn-secondary" style={{ borderColor: '#fff', color: '#fff', marginTop: '1rem' }}>
            Explore Now
          </Link>
        )}
      </div>
    </section>
  );
}
