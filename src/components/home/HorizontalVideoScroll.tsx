"use client";

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';

interface Campaign {
  _id?: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  linkUrl: string;
  category: string;
  mediaType: string;
}

interface HorizontalVideoScrollProps {
  videos: Campaign[];
}

export default function HorizontalVideoScroll({ videos }: HorizontalVideoScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <section style={{ backgroundColor: '#000', padding: '4rem 0', overflow: 'hidden' }}>
      <div style={{ padding: '0 4rem', marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 300, 
          letterSpacing: '0.15em', 
          color: '#fff', 
          textTransform: 'uppercase' 
        }}>
          Featured Visuals
        </h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Explore our latest campaigns</p>
      </div>

      <div 
        ref={scrollRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: '2rem',
          padding: '0 4rem',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none',  // IE and Edge
        }}
        className="hide-scrollbar"
      >
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
        
        {videos.map((video, index) => (
          <div 
            key={video._id || index}
            style={{
              flex: '0 0 auto',
              width: '80vw',
              maxWidth: '800px',
              height: '60vh',
              minHeight: '400px',
              scrollSnapAlign: 'center',
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <video 
              src={video.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.7)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '2rem',
              left: '2rem',
              color: '#fff',
              zIndex: 2,
              background: 'rgba(0,0,0,0.3)',
              padding: '1.5rem',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: 400, letterSpacing: '0.1em' }}>{video.title}</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#ddd', fontSize: '0.9rem' }}>{video.subtitle}</p>
              {video.linkUrl && (
                <Link href={video.linkUrl} style={{
                  display: 'inline-block',
                  padding: '0.8rem 2rem',
                  backgroundColor: '#fff',
                  color: '#000',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}>
                  Explore
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
