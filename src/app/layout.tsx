import type { Metadata, Viewport } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";
import "./responsive.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin-sans",
  weight: ["300", "400", "600", "700"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com'),
  title: {
    template: '%s | Bespokewala',
    default: 'Bespokewala | Luxury Indian Fashion',
  },
  description: "Discover Bespokewala's luxury couture, footwear and jewellery collections, crafted with timeless elegance and exceptional design.",
  openGraph: {
    title: 'Bespokewala | Luxury Indian Fashion',
    description: "Discover Bespokewala's luxury couture, footwear and jewellery collections, crafted with timeless elegance and exceptional design.",
    siteName: 'Bespokewala',
    type: 'website',
    images: [{ url: '/bespoken-transparent.png', width: 1200, height: 630, alt: 'Bespokewala — Luxury Indian Fashion' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bespokewala',
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={josefinSans.variable}>
      <body>
        <CurrencyProvider>
          <WishlistProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </WishlistProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
