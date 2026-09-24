import { generateStaticPageMetadata } from '@/lib/seo';
import TermsConditionsContent from '@/components/legal/TermsConditionsContent';

export const metadata = generateStaticPageMetadata(
  'Terms & Conditions',
  "Read Bespokewala's Terms & Conditions governing the use of our website and the purchase of our products.",
  '/terms-conditions'
);

export default function TermsConditionsPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <TermsConditionsContent />
      </main>
          </>
  );
}
