"use client";

import React, { useState } from 'react';

export default function SeoAccordion({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{ marginTop: '6rem', borderTop: '1px solid #eaeaea' }}>
      <div 
        style={{ 
          padding: '2rem 0',
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#333', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            padding: '1rem',
          }}
        >
          {isExpanded ? 'Read Less' : 'Read More About This Collection'}
          <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
            ▼
          </span>
        </button>
      </div>
      
      <div 
        style={{ 
          maxHeight: isExpanded ? '2000px' : '0', 
          overflow: 'hidden', 
          transition: 'max-height 0.5s ease-in-out, opacity 0.5s ease-in-out',
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div 
          className="seo-content" 
          style={{ 
            paddingBottom: '4rem', 
            color: '#555', 
            lineHeight: '1.8', 
            fontSize: '0.95rem' 
          }} 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </div>
    </div>
  );
}
