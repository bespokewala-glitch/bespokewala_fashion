/**
 * consentManager.ts
 *
 * Centralised helpers to update Google Consent Mode and Meta Pixel consent
 * when the user's cookie preferences change.
 * Called only from CookieConsentContext — never directly from components.
 */

export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
}

export const CONSENT_KEY = 'bw_cookie_consent';

/** Read the current consent from localStorage (SSR-safe). */
export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

/** Persist consent to localStorage. */
export function writeConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
}

/**
 * Update Google Consent Mode v2.
 * Safe to call even before gtag.js loads — gtag queues commands in dataLayer.
 */
export function updateGoogleConsent(analytics: boolean, marketing: boolean): void {
  if (typeof window === 'undefined') return;
  // Ensure dataLayer exists (it's created by GoogleAnalytics.tsx, but may not
  // be ready yet on the very first call from the context init).
  window.dataLayer = window.dataLayer || [];
  // Push directly so we don't depend on the gtag wrapper being initialised yet.
  window.dataLayer.push('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  });
}

/**
 * Update Meta Pixel consent.
 * If fbq is not loaded (rejected / not yet loaded), this is a no-op.
 */
export function updateMetaConsent(marketing: boolean): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (marketing) {
    window.fbq('consent', 'grant');
  } else {
    window.fbq('consent', 'revoke');
  }
}
