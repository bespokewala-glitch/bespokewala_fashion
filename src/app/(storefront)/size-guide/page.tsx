import { generateStaticPageMetadata } from '@/lib/seo';
import SizeGuideContent from '@/components/size-guide/SizeGuideContent';

export const metadata = generateStaticPageMetadata(
  'Size Guide',
  "Find your perfect fit with Bespokewala Fashion's comprehensive size guide. Detailed measurement charts for lehengas, sarees, kurtis, blouses, sherwanis, suits, and accessories.",
  '/size-guide'
);

export default function SizeGuidePage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <SizeGuideContent />
      </main>
          </>
  );
}
