"use client";

/**
 * GoogleAnalytics component
 *
 * Mirrors the existing MetaPixel.tsx architecture:
 * - Uses next/script with strategy="afterInteractive" for safe client-side loading
 * - Wrapped in <Suspense> to avoid hydration errors from useSearchParams
 * - Tracks SPA page_view on pathname/searchParams changes
 * - No-op when NEXT_PUBLIC_GA_ID is not set
 *
 * Cookie Consent Mode v2:
 * - Injects a "beforeInteractive" script that sets consent defaults to "denied"
 *   so no analytics/ad storage is used before consent is granted.
 * - On mount, replays the saved consent state (if user already decided) so
 *   gtag gets the right state before the first page_view.
 */

import React, { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID, pageview } from "@/lib/gtag";
import { readConsent, updateGoogleConsent } from "@/lib/consentManager";

function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Track whether the initial page_view has fired so we don't duplicate
  // the page_view that the gtag.js snippet fires automatically on load.
  const isInitialLoad = useRef(true);

  // On mount, replay previously saved consent so gtag has the correct state
  // before the auto page_view fires (strategy="afterInteractive" means this
  // runs at the same time as the script load, but dataLayer queuing ensures
  // the update is processed before the config command).
  useEffect(() => {
    const saved = readConsent();
    if (saved && saved.decided) {
      updateGoogleConsent(saved.analytics, saved.marketing);
    }
  }, []);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // Skip the very first render — gtag.js fires page_view on load automatically
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Fire page_view on client-side route changes (SPA navigation)
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    pageview(url);
  }, [pathname, searchParams]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      {/* ── Google Consent Mode v2 Defaults ──────────────────────────────────
          Must run BEFORE gtag.js loads. Sets all consent signals to "denied"
          so no analytics or ad cookies are set until the user grants consent.
          wait_for_update gives the consent context 500ms to replay saved prefs
          before gtag processes any commands.
      ──────────────────────────────────────────────────────────────────────── */}
      <Script
        id="google-consent-defaults"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500
            });
          `,
        }}
      />

      {/* Load the Google tag (gtag.js) script */}
      <Script
        id="google-analytics-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      {/* Initialize dataLayer and gtag — consent defaults are already set above */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}
