"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

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

  useEffect(() => {
    if (!FB_PIXEL_ID) return;

    // This ensures PageView fires on route changes
    if (loaded) {
      pageview();
    }
  }, [pathname, searchParams, loaded]);

  if (!FB_PIXEL_ID) {
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
