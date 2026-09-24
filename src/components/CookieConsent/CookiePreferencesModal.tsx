"use client";

/**
 * CookiePreferencesModal.tsx
 *
 * Centred modal for per-category cookie preference management.
 * Categories: Necessary (always on), Analytics, Marketing.
 * Opened from CookieBanner ("Manage Preferences") and Footer ("Cookie Preferences").
 */

import React, { useState } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';

function Toggle({
  id,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (val: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        width: '40px',
        height: '22px',
        flexShrink: 0,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '11px',
          backgroundColor: checked ? '#1c1c1c' : '#d0d0d0',
          transition: 'background-color 0.2s',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: checked ? '20px' : '3px',
          top: '3px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </label>
  );
}

interface CategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  id: string;
  onChange?: (val: boolean) => void;
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  id,
  onChange,
}: CategoryRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1rem 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#1c1c1c',
            fontWeight: 600,
            marginBottom: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {title}
          {disabled && (
            <span
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                color: '#888',
                fontWeight: 400,
              }}
            >
              Always enabled
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            color: '#666',
            lineHeight: '1.5',
          }}
        >
          {description}
        </p>
      </div>
      <div style={{ paddingTop: '2px' }}>
        <Toggle
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function CookiePreferencesModal() {
  const { consent, savePreferences, closePreferences, rejectAll, acceptAll } =
    useCookieConsent();

  const [analyticsOn, setAnalyticsOn] = useState(consent.analytics);
  const [marketingOn, setMarketingOn] = useState(consent.marketing);

  const handleSave = () => {
    savePreferences(analyticsOn, marketingOn);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closePreferences}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 10000,
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          backgroundColor: '#fff',
          width: '92%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          padding: '2rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '0.95rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#1c1c1c',
            }}
          >
            Cookie Preferences
          </h2>
          <button
            onClick={closePreferences}
            aria-label="Close preferences"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 0 0 1rem',
              color: '#888',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <p
          style={{
            margin: '0 0 1.25rem',
            fontSize: '0.78rem',
            color: '#666',
            lineHeight: '1.6',
          }}
        >
          Manage your cookie preferences below. Necessary cookies cannot be
          disabled as they are essential for the website to function.
        </p>

        {/* Categories */}
        <CategoryRow
          id="pref-necessary"
          title="Necessary Cookies"
          description="Required for login, sessions, cart, checkout, security, and payment processing. These cookies keep Bespokewala working."
          checked={true}
          disabled={true}
        />
        <CategoryRow
          id="pref-analytics"
          title="Analytics Cookies"
          description="Used by Google Analytics (GA4) to measure website usage and improve your experience. No personally identifiable information is collected."
          checked={analyticsOn}
          onChange={setAnalyticsOn}
        />
        <CategoryRow
          id="pref-marketing"
          title="Marketing Cookies"
          description="Used by Meta Pixel for advertising, conversion tracking, and marketing measurement. Helps us show you relevant ads."
          checked={marketingOn}
          onChange={setMarketingOn}
        />

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleSave}
            style={{
              flex: '1 1 120px',
              padding: '0.75rem 1rem',
              background: '#1c1c1c',
              color: '#fff',
              border: '1px solid #1c1c1c',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            Save Preferences
          </button>
          <button
            onClick={acceptAll}
            style={{
              flex: '1 1 100px',
              padding: '0.75rem 1rem',
              background: 'transparent',
              color: '#1c1c1c',
              border: '1px solid #1c1c1c',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Accept All
          </button>
          <button
            onClick={rejectAll}
            style={{
              flex: '1 1 100px',
              padding: '0.75rem 1rem',
              background: 'transparent',
              color: '#888',
              border: '1px solid #d0d0d0',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Reject All
          </button>
        </div>
      </div>
    </>
  );
}
