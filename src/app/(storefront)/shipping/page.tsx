import { generateStaticPageMetadata } from '@/lib/seo';
import ShippingPageContent from '@/components/shipping/ShippingPageContent';

export const metadata = generateStaticPageMetadata(
  'Shipping & Returns',
  "Learn about Bespokewala's shipping options, delivery timelines, return policy, and how to track your order. Free shipping on orders above ₹15,000 within India.",
  '/shipping'
);

export default function ShippingPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <ShippingPageContent />
      </main>
          </>
  );
}
