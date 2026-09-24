import { generateStaticPageMetadata, generateFAQSchema } from '@/lib/seo';
import FaqPageContent from '@/components/faq/FaqPageContent';

export const metadata = generateStaticPageMetadata(
  'FAQ — Frequently Asked Questions',
  'Find answers to the most common questions about Bespokewala — orders, shipping, returns, custom garments, sizing, payments, and more.',
  '/faq'
);

// Core FAQ data for FAQPage structured data (Google rich results)
// Keep this in sync with the visible FAQ content in FaqPageContent.
const FAQ_ITEMS = [
  {
    question: 'How long does shipping take within India?',
    answer: 'Standard shipping within India takes 3-7 days. Footwear typically takes 15-20 days, and for Couture, shipping time is 40–50 days.'
  },
  {
    question: 'Do you offer custom or bespoke orders?',
    answer: 'Yes, Bespokewala specialises in custom and bespoke garments. Please contact us via WhatsApp or our consultation page to discuss your requirements.'
  },

  {
    question: 'How do I find my size?',
    answer: 'Please refer to our Size Guide page for detailed measurement charts across all product categories including lehengas, sarees, and blouses.'
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship internationally. Shipping timelines and costs vary by destination. Please contact us for a shipping quote to your country.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards, UPI, net banking, and select EMI options. All payments are processed securely.'
  },
];

export default function FaqPage() {
  const faqSchema = generateFAQSchema(FAQ_ITEMS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main style={{ minHeight: '80vh' }}>
        <FaqPageContent />
      </main>
    </>
  );
}
