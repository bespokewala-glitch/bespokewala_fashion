"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

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
    { title: 'The Bridal Edit', subtitle: 'New Collection', videoUrl: '/clothures_video.mp4', linkUrl: '/products/couture/womens' },
    { title: 'High Jewellery', subtitle: 'Signature', videoUrl: '/jwellay_video.mp4', linkUrl: '/products/jewellery' },
    { title: 'Footwear', subtitle: 'Essentials', videoUrl: '/accessary_video.mp4', linkUrl: '/products/footwear' }
  ];

  const activeCampaigns = campaigns && campaigns.length > 0 ? campaigns : fallbackCampaigns;
  const currentCampaign = activeCampaigns[currentIndex];

  const handleVideoEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isImg = activeCampaigns[currentIndex]?.videoUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    
    // Only auto-slide if we have more than 1 campaign
    if (activeCampaigns.length > 1) {
      if (isImg) {
        timer = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length);
        }, 5000);
      }
    }
    
    // Always attempt to autoplay video when index changes
    if (!isImg && videoRef.current) {
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
    <section style={heroStyle} className="mobile-hero-height">
      {isImage ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <OptimizedImage 
            src={currentCampaign?.videoUrl || ''}
            alt={currentCampaign?.title ? `Bespokewala ${currentCampaign.title} collection` : 'Bespokewala luxury collection'}
            fill
            style={{ objectFit: 'cover', filter: 'brightness(0.7)' }}
            priority={true}
            variant="medium"
          />
        </div>
      ) : (
        <video 
          ref={videoRef}
          src={currentCampaign?.videoUrl}
          autoPlay
          muted
          loop={activeCampaigns.length <= 1}
          playsInline
          onEnded={activeCampaigns.length > 1 ? handleVideoEnd : undefined}
          style={videoStyle}
        />
      )}
      
      {activeCampaigns.length > 1 && (
        <>
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
        </>
      )}

      <div style={overlayContentStyle} className="hero-overlay mobile-p-4">
        <div style={subtitleStyle} className="mobile-font-sm">{currentCampaign?.subtitle}</div>
        <h2 style={titleStyle} className="mobile-hero-title">{currentCampaign?.title}</h2>
        {currentCampaign?.linkUrl && (
          <Link href={currentCampaign.linkUrl} prefetch={false} className="btn-secondary" style={{ borderColor: '#fff', color: '#fff', marginTop: '1rem', minHeight: '44px', minWidth: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-label={`Explore ${currentCampaign?.title || 'collection'}`}>
            {currentCampaign?.title ? (
              currentCampaign.title.toLowerCase().includes('jewellery') || currentCampaign.title.toLowerCase().includes('footwear') 
                ? `Shop ${currentCampaign.title}` 
                : `Explore ${currentCampaign.title}`
            ) : 'Discover Collection'}
          </Link>
        )}
      </div>
    </section>
  );
}
