"use client";

import React, { useState } from 'react';
import VirtualTryOnModal from './VirtualTryOnModal';

interface VirtualTryOnButtonProps {
  garmentImageUrl: string;
}

export default function VirtualTryOnButton({ garmentImageUrl }: VirtualTryOnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const primaryBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '1rem', // Space before Add to Cart
  };  

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{...primaryBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"></path>
          <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.35 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"></path>
        </svg>
        VIRTUAL TRY-ON
      </button>

      <VirtualTryOnModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productImage={garmentImageUrl}
      />
    </>
  );
}
