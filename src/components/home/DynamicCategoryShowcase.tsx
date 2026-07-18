"use client";

import React from 'react';
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

interface DynamicCategoryShowcaseProps {
  categoryName: string;
  campaigns: Campaign[];
}

export default function DynamicCategoryShowcase({ categoryName, campaigns }: DynamicCategoryShowcaseProps) {
  if (!campaigns || campaigns.length === 0) return null;

  return (
    <section style={{ padding: '6rem 4rem', backgroundColor: '#fff' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 300, 
          letterSpacing: '0.2em', 
          color: '#000', 
          textTransform: 'uppercase' 
        }}>
          {categoryName}
        </h2>
        <div style={{ width: '60px', height: '2px', backgroundColor: '#000', margin: '1rem auto' }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        alignItems: 'stretch'
      }}>
        {campaigns.map((camp, index) => {
          // Make the first item span more columns if it's a prominent video, or just rely on auto-fit
          // We can use a dynamic style based on index
          const isLarge = index === 0 && campaigns.length > 2;

          return (
            <div 
              key={camp._id || index}
              style={{
                position: 'relative',
                gridColumn: isLarge ? '1 / -1' : 'auto',
                minHeight: isLarge ? '70vh' : '400px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease',
              }}
              className="showcase-card"
            >
              <style dangerouslySetInnerHTML={{__html: `
                .showcase-card:hover {
                  transform: translateY(-5px);
                }
                .showcase-card:hover .overlay-content {
                  background: rgba(0,0,0,0.6);
                }
              `}} />
              
              {camp.mediaType === 'video' ? (
                <video 
                  src={camp.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <img 
                  src={camp.videoUrl}
                  alt={camp.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              <div 
                className="overlay-content"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '2rem',
                  color: '#fff',
                  transition: 'background 0.3s ease'
                }}
              >
                <h3 style={{ fontSize: isLarge ? '2.5rem' : '1.5rem', fontWeight: 300, margin: '0 0 0.5rem 0', letterSpacing: '0.1em' }}>
                  {camp.title}
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', letterSpacing: '0.05em', color: '#eaeaea' }}>
                  {camp.subtitle}
                </p>
                {camp.linkUrl && (
                  <Link href={camp.linkUrl} style={{
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    padding: '0.8rem 2rem',
                    border: '1px solid #fff',
                    color: '#fff',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#fff';
                  }}
                  >
                    View Collection
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
