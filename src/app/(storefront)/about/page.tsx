import { generateStaticPageMetadata } from '@/lib/seo';
import AboutPageContent from '@/components/about/AboutPageContent';

export const metadata = generateStaticPageMetadata(
  'About Us',
  'Discover the story behind Bespokewala — our mission to celebrate Indian textile heritage, our vision for global luxury, and the master craftsmen who bring every garment to life.',
  '/about'
);

export default function AboutPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <AboutPageContent />
      </main>
          </>
  );
}
