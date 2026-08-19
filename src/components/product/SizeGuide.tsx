import React from 'react';
import Link from 'next/link';

export default function SizeGuide() {
  return (
    <Link 
      href="/size-guide"
      style={{ 
        fontSize: '0.85rem', 
        color: '#666', 
        textDecoration: 'underline',
      }}
    >
      Need help finding your size? View Size Guide ?
    </Link>
  );
}

