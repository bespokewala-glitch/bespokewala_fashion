"use client";

/**
 * CookieBanner.tsx
 *
 * Premium, bottom-fixed cookie consent banner.
 * Appears only when the user has not yet made a consent decision.
 * Three actions: Accept All · Reject All · Manage Preferences (opens modal).
 * Does NOT block the page — positioned above footer, fixed to viewport bottom.
 */

import React from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import CookiePreferencesModal from './CookiePreferencesModal';

export default function CookieBanner() {
  const { showBanner, isPreferencesOpen, acceptAll, rejectAll, openPreferences } =
    useCookieConsent();

  if (!showBanner && !isPreferencesOpen) return null;

  return (
    <>
      {/* Preferences modal (shared between banner & footer link) */}
      {isPreferencesOpen && <CookiePreferencesModal />}

      {/* Banner — only shown when user hasn't decided yet */}
      {showBanner && !isPreferencesOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#fff',
            borderTop: '1px solid #e5e5e5',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
          className="cookie-banner"
        >
          {/* Text */}
          <div style={{ flex: '1 1 280px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#1c1c1c',
                lineHeight: '1.6',
                letterSpacing: '0.01em',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0.3rem',
                }}
              >
                Your Privacy Matters
              </strong>
              We use necessary cookies to keep Bespokewala working and optional
              cookies to understand how visitors use our website and improve your
              experience.
            </p>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            <button
              onClick={rejectAll}
              style={{
                padding: '0.6rem 1.25rem',
                background: 'transparent',
                color: '#1c1c1c',
                border: '1px solid #1c1c1c',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              Reject All
            </button>

            <button
              onClick={acceptAll}
              style={{
                padding: '0.6rem 1.25rem',
                background: '#1c1c1c',
                color: '#fff',
                border: '1px solid #1c1c1c',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              }}
            >
              Accept All
            </button>

            <button
              onClick={openPreferences}
              style={{
                padding: '0.6rem 0.5rem',
                background: 'transparent',
                color: '#888',
                border: 'none',
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textDecoration: 'underline',
              }}
            >
              Manage Preferences
            </button>
          </div>
        </div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .cookie-banner {
            padding: 1rem !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .cookie-banner > div:last-child {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </>
  );
}
