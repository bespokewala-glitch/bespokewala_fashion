/**
 * Centralized FAQ & Policy Knowledge Base for the Bespokewala Style Concierge.
 * Edit this file to update any chatbot FAQ answers — no code changes needed elsewhere.
 */

export interface FaqEntry {
  question: string;
  answer: string;
  keywords: string[];
}

export interface FaqCategory {
  id: string;
  title: string;
  entries: FaqEntry[];
}

export const SUPPORT_CONTACTS = {
  whatsapp: '+91 75067 67452',
  whatsappUrl: 'https://wa.me/917506767452',
  email: 'bespokewala@gmail.com',
  emailUrl: 'mailto:bespokewala@gmail.com',
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'orders',
    title: 'Orders & Payments',
    entries: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our collections, select your size and quantity, and click "Add to Cart". Once ready, proceed to checkout, fill in your shipping details, and complete payment. You\'ll receive an order confirmation email within minutes.',
        keywords: ['place order', 'how to order', 'buy', 'purchase', 'checkout'],
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major Credit & Debit Cards (Visa, Mastercard, Amex, RuPay), Net Banking, UPI (GPay, PhonePe, Paytm), EMI options via select banks, and Cash on Delivery (COD) for orders within India below ₹50,000.',
        keywords: ['payment', 'pay', 'credit card', 'debit card', 'upi', 'cod', 'cash on delivery', 'emi', 'net banking'],
      },
      {
        question: 'Is it safe to pay on your website?',
        answer: 'Absolutely. Our website uses 256-bit SSL encryption and is PCI-DSS compliant. All transactions are processed securely through Razorpay. We do not store your card details.',
        keywords: ['safe', 'security', 'secure', 'ssl', 'fraud', 'card details'],
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'Order modifications or cancellations are possible within 2 hours of placing the order. After that, the order enters our dispatch queue. Please email bespokewala@gmail.com or WhatsApp us immediately at +91 75067 67452 with your order number.',
        keywords: ['cancel', 'modify', 'change order', 'cancel order'],
      },
      {
        question: 'Will I receive an invoice?',
        answer: 'Yes. A GST-compliant invoice is automatically emailed to you once your order is confirmed. You can also download it from your account dashboard under "My Orders".',
        keywords: ['invoice', 'receipt', 'bill', 'gst'],
      },
      {
        question: 'Do you offer EMI?',
        answer: 'Yes, No-Cost EMI is available for 3, 6, and 9 months on select Credit Cards (HDFC, ICICI, Axis, SBI, Kotak, Yes Bank) for orders above ₹5,000.',
        keywords: ['emi', 'installment', 'monthly payment'],
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    entries: [
      {
        question: 'How long does shipping take?',
        answer: 'Standard delivery within India takes 5–7 business days. Express delivery (2–3 business days) is available at checkout for an additional charge. International orders typically take 10–14 business days.',
        keywords: ['shipping time', 'delivery time', 'how long', 'when will i receive', 'dispatch'],
      },
      {
        question: 'Is shipping free?',
        answer: 'Yes! We offer free standard shipping on all orders above ₹10,000 within India. Orders below ₹10,000 attract a flat ₹500 shipping fee.',
        keywords: ['free shipping', 'shipping cost', 'delivery charge', 'shipping fee'],
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship worldwide. International shipping charges are calculated at checkout based on your location and order weight. Customs and import duties may apply and are the responsibility of the recipient.',
        keywords: ['international shipping', 'ship abroad', 'overseas', 'worldwide', 'export'],
      },
      {
        question: 'How do I track my order?',
        answer: 'Once your order is dispatched, you\'ll receive a tracking link via email and SMS. You can also check your order status from your account dashboard under "My Orders".',
        keywords: ['track', 'tracking', 'where is my order', 'order status', 'shipment'],
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Exchanges',
    entries: [
      {
        question: 'What is your return policy?',
        answer: 'We accept returns within 7 days of delivery for unused, unworn items in their original condition with all tags intact. Custom and bespoke orders are non-returnable. To initiate a return, email bespokewala@gmail.com with your order number.',
        keywords: ['return', 'returns', 'return policy', 'send back', 'refund'],
      },
      {
        question: 'How long does a refund take?',
        answer: 'Once we receive and inspect your return, refunds are processed within 5–7 business days. The amount is credited back to your original payment method.',
        keywords: ['refund', 'money back', 'refund time'],
      },
      {
        question: 'Can I exchange an item?',
        answer: 'Yes, exchanges are available for size or colour within 7 days of delivery (subject to availability). Email us at bespokewala@gmail.com or WhatsApp +91 75067 67452 with your order number.',
        keywords: ['exchange', 'swap', 'different size', 'different colour'],
      },
    ],
  },
  {
    id: 'products',
    title: 'Products & Sizing',
    entries: [
      {
        question: 'How do I find my size?',
        answer: 'Each product page includes a detailed Size Guide with measurements in inches and centimetres. We recommend measuring your bust, waist, and hip before ordering. If between sizes, size up for comfort.',
        keywords: ['size', 'sizing', 'size guide', 'measurements', 'fit', 'which size'],
      },
      {
        question: 'Are your products made in India?',
        answer: 'Yes, every Bespokewala piece is crafted entirely in India by skilled artisans. Our fabrics are sourced from renowned textile hubs — Banaras for silks, Jaipur for block-prints, Surat for chiffons.',
        keywords: ['made in india', 'origin', 'where made', 'artisan', 'fabric source'],
      },
      {
        question: 'How should I care for my garment?',
        answer: 'Handwash or dry-clean only for embroidered pieces; use cold water and a gentle detergent; never tumble-dry or wring delicate fabrics; store in a breathable muslin bag away from direct sunlight.',
        keywords: ['care', 'wash', 'clean', 'dry clean', 'maintenance', 'garment care'],
      },
      {
        question: 'Can I request a fabric swatch?',
        answer: 'Yes. For orders above ₹10,000, you may request up to 3 fabric swatches. Email bespokewala@gmail.com with the product names and your shipping address. Swatches are sent free of charge within India.',
        keywords: ['swatch', 'fabric sample', 'colour sample', 'material sample'],
      },
    ],
  },
  {
    id: 'custom',
    title: 'Custom & Bespoke Orders',
    entries: [
      {
        question: 'Do you offer custom or made-to-measure garments?',
        answer: 'Yes — custom orders are at the heart of what we do. You can request a fully bespoke garment or a made-to-measure version of any existing design. Contact us via WhatsApp or email to begin a personalised consultation.',
        keywords: ['custom', 'bespoke', 'made to measure', 'tailor', 'personalised', 'customise'],
      },
      {
        question: 'How long does a custom order take?',
        answer: 'Ready-to-wear alterations: 7–10 days. Semi-custom (custom fit on a standard design): 14–21 days. Fully bespoke couture: 4–8 weeks.',
        keywords: ['custom order time', 'bespoke time', 'how long custom'],
      },
      {
        question: 'Do you offer bridal consultation?',
        answer: 'Yes! We offer dedicated bridal consultations at our Mumbai studio by appointment. Our bridal specialist helps you choose fabrics, embroideries, and silhouettes. WhatsApp +91 75067 67452 to book.',
        keywords: ['bridal consultation', 'wedding dress', 'bridal appointment', 'bridal outfit'],
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact & Support',
    entries: [
      {
        question: 'How can I contact you?',
        answer: 'You can reach us via WhatsApp at +91 75067 67452 (Mon–Sat, 10am–7pm IST) or email us at bespokewala@gmail.com. We aim to respond within 24 hours.',
        keywords: ['contact', 'reach', 'call', 'phone', 'email', 'whatsapp', 'support', 'help'],
      },
    ],
  },
];

/**
 * Search for a relevant FAQ answer based on the user's question.
 * Returns the best-matching entry or null if nothing matches well.
 */
export function searchFAQ(query: string): { category: string; question: string; answer: string } | null {
  const lowerQuery = query.toLowerCase();
  let bestMatch: { category: string; question: string; answer: string } | null = null;
  let bestScore = 0;

  for (const cat of FAQ_CATEGORIES) {
    for (const entry of cat.entries) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (lowerQuery.includes(kw)) {
          score += kw.split(' ').length; // multi-word keywords score higher
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { category: cat.title, question: entry.question, answer: entry.answer };
      }
    }
  }

  return bestScore > 0 ? bestMatch : null;
}
