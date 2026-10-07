import { generateStaticPageMetadata } from '@/lib/seo';

export const metadata = generateStaticPageMetadata(
  'Virtual Consultation — Personal Stylist & Sizing Concierge',
  'Book a one-on-one virtual consultation session with Bespokewala master stylists. Receive expert guidance on custom tailoring, sizing measurements, and luxury bespoke couture.',
  '/consultation'
);

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
