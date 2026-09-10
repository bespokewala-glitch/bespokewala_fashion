"use client";

/**
 * GoogleAnalytics component
 *
 * Mirrors the existing MetaPixel.tsx architecture:
 * - Uses next/script with strategy="afterInteractive" for safe client-side loading
 * - Wrapped in <Suspense> to avoid hydration errors from useSearchParams
 * - Tracks SPA page_view on pathname/searchParams changes
 * - No-op when NEXT_PUBLIC_GA_ID is not set
 */

import React, { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID, pageview } from "@/lib/gtag";

function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Track whether the initial page_view has fired so we don't duplicate
  // the page_view that the gtag.js snippet fires automatically on load.
  const isInitialLoad = useRef(true);

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
      {/* Load the Google tag (gtag.js) script */}
      <Script
        id="google-analytics-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      {/* Initialize dataLayer and gtag */}
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
