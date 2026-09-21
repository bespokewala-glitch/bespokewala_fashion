"use client";

/**
 * CookieConsentContext.tsx
 *
 * Single source of truth for cookie consent across the app.
 * - Reads/writes from localStorage key `bw_cookie_consent`.
 * - Exposes acceptAll / rejectAll / savePreferences / openPreferences.
 * - Drives Google Consent Mode v2 and Meta Pixel consent via consentManager.ts.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  ConsentState,
  readConsent,
  writeConsent,
  updateGoogleConsent,
  updateMetaConsent,
} from '@/lib/consentManager';

interface CookieConsentContextType {
  consent: ConsentState;
  showBanner: boolean;
  isPreferencesOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (analytics: boolean, marketing: boolean) => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  decided: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(
  undefined
);

function applyConsent(state: ConsentState) {
  writeConsent(state);
  updateGoogleConsent(state.analytics, state.marketing);
  updateMetaConsent(state.marketing);
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(defaultConsent);
  const [showBanner, setShowBanner] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // On mount, read persisted consent and sync tracking
  useEffect(() => {
    const saved = readConsent();
    if (saved && saved.decided) {
      setConsent(saved);
      setShowBanner(false);
      // Immediately replay consent update so trackers get the right state
      // on page load before any events fire.
      updateGoogleConsent(saved.analytics, saved.marketing);
      updateMetaConsent(saved.marketing);
    } else {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const newState: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      decided: true,
    };
    setConsent(newState);
    setShowBanner(false);
    setIsPreferencesOpen(false);
    applyConsent(newState);
  }, []);

  const rejectAll = useCallback(() => {
    const newState: ConsentState = {
      necessary: true,
      analytics: false,
      marketing: false,
      decided: true,
    };
    setConsent(newState);
    setShowBanner(false);
    setIsPreferencesOpen(false);
    applyConsent(newState);
  }, []);

  const savePreferences = useCallback(
    (analytics: boolean, marketing: boolean) => {
      const newState: ConsentState = {
        necessary: true,
        analytics,
        marketing,
        decided: true,
      };
      setConsent(newState);
      setShowBanner(false);
      setIsPreferencesOpen(false);
      applyConsent(newState);
    },
    []
  );

  const openPreferences = useCallback(() => setIsPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setIsPreferencesOpen(false), []);

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        showBanner,
        isPreferencesOpen,
        acceptAll,
        rejectAll,
        savePreferences,
        openPreferences,
        closePreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextType {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}
