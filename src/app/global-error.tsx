'use client';

import React, { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Root Layout Error]:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#0d0d0d',
          color: '#f5f0eb',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            margin: '2rem',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            border: '1px solid rgba(200, 169, 110, 0.3)',
            borderRadius: '4px',
            backgroundColor: '#141414',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#c8a96e',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          >
            Bespokewala Atelier
          </span>

          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 300,
              letterSpacing: '0.05em',
              marginBottom: '1rem',
              color: '#fff',
            }}
          >
            Atelier System Notice
          </h1>

          <p
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.8,
              color: '#a89f91',
              marginBottom: '2rem',
            }}
          >
            An unexpected error occurred while initializing the application.
            Please refresh the page or try again in a few moments.
          </p>

          <button
            onClick={() => reset()}
            style={{
              padding: '0.9rem 2.2rem',
              backgroundColor: '#c8a96e',
              color: '#0d0d0d',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Reload Atelier
          </button>
        </div>
      </body>
    </html>
  );
}
