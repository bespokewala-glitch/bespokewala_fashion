"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { readConsent } from "@/lib/consentManager";

// Extend window object for fbq
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const pageview = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
};

// Custom event helper for browser-side pixel
// Guards on window.fbq — if Pixel was not loaded (marketing consent denied),
// fbq will be undefined and this is a safe no-op.
export const event = (name: string, options = {}, eventIdData?: { eventID: string }) => {
  if (typeof window !== "undefined" && window.fbq) {
    if (eventIdData) {
      window.fbq("track", name, options, eventIdData);
    } else {
      window.fbq("track", name, options);
    }
  }
};

function MetaPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState(false);

  // Consent gate — only render the Pixel script when marketing consent is granted.
  // On first render (SSR / initial mount), read from localStorage.
  // If consent was not granted, return null — the Pixel script is never injected.
  const [marketingConsented, setMarketingConsented] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    if (saved && saved.marketing) {
      setMarketingConsented(true);
    }
  }, []);

  useEffect(() => {
    if (!FB_PIXEL_ID) return;
    // Fire PageView on subsequent SPA route changes (not on the initial load —
    // that is handled by the fbq('track', 'PageView') inside the Script block).
    if (loaded) {
      pageview();
    }
  }, [pathname, searchParams, loaded]);

  if (!FB_PIXEL_ID || !marketingConsented) {
    // Do not inject the Pixel script until the user grants marketing consent.
    return null;
  }

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

export default function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelInner />
    </Suspense>
  );
}
