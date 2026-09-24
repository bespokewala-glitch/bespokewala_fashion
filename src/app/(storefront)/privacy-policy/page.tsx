import { generateStaticPageMetadata } from '@/lib/seo';
import PrivacyPolicyContent from '@/components/legal/PrivacyPolicyContent';

export const metadata = generateStaticPageMetadata(
  'Privacy Policy',
  "Read Bespokewala's Privacy Policy to understand how we collect, use, and protect your personal information when you shop with us.",
  '/privacy-policy'
);

export default function PrivacyPolicyPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <PrivacyPolicyContent />
      </main>
          </>
  );
}
