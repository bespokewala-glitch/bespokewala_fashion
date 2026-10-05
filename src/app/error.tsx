'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log full error to browser console / monitoring service with digest
    console.error('[Application ErrorBoundary Caught Error]:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d0d0d',
        color: '#f5f0eb',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          padding: '3.5rem 2.5rem',
          borderRadius: '4px',
          border: '1px solid rgba(200, 169, 110, 0.25)',
          background: 'radial-gradient(ellipse at center, rgba(30, 25, 20, 0.7) 0%, rgba(13, 13, 13, 0.95) 100%)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.8rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#c8a96e',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          Bespokewala Concierge
        </span>

        <h1
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 300,
            letterSpacing: '0.04em',
            margin: '0 0 1rem',
            color: '#fff',
            lineHeight: 1.2,
          }}
        >
          An Unexpected Interruption
        </h1>

        <div
          style={{
            width: '50px',
            height: '1px',
            backgroundColor: '#c8a96e',
            margin: '0 auto 1.5rem',
            opacity: 0.8,
          }}
        />

        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.8,
            color: '#a89f91',
            marginBottom: '2rem',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 300,
          }}
        >
          We encountered an unexpected difficulty loading this section of the atelier.
          Our technical team has been alerted and is reviewing the issue.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'rgba(200, 169, 110, 0.6)',
              fontFamily: 'monospace',
              marginBottom: '2rem',
            }}
          >
            Reference Code: {error.digest}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              padding: '0.9rem 2rem',
              backgroundColor: '#c8a96e',
              color: '#0d0d0d',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              transition: 'opacity 0.2s ease',
            }}
          >
            Try Again
          </button>

          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.9rem 2rem',
              backgroundColor: 'transparent',
              color: '#f5f0eb',
              border: '1px solid rgba(200, 169, 110, 0.4)',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '2px',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
