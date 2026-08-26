export type Intent =
  | 'FAQ'
  | 'PRODUCT_SEARCH'
  | 'CATEGORY_BROWSE'
  | 'ORDER_TRACKING'
  | 'CONTACT'
  | 'WISHLIST_CART'
  | 'AI_RECOMMENDATION'
  | 'GENERAL_CONVERSATION'
  | 'UNKNOWN';

export function detectIntent(text: string): { intent: Intent; confidence: number } {
  const lower = text.toLowerCase();

  // 1. General Conversation (Hi, Thanks, Bye)
  if (/^(hi|hello|hey|namaste|thanks|thank you|bye|goodbye)$/i.test(lower.trim())) {
    return { intent: 'GENERAL_CONVERSATION', confidence: 0.9 };
  }

  // 2. Order Tracking
  if (/order|track|delivery status|where is my (order|package)|when will i receive/i.test(lower)) {
    return { intent: 'ORDER_TRACKING', confidence: 0.9 };
  }

  // 3. Contact & Support
  if (/contact|whatsapp|email|phone number|call you|support|help desk/i.test(lower)) {
    return { intent: 'CONTACT', confidence: 0.9 };
  }

  // 4. Wishlist & Cart
  if (/wishlist|cart|bag|add to|buy this/i.test(lower)) {
    return { intent: 'WISHLIST_CART', confidence: 0.8 };
  }

  // 5. FAQ (Shipping, Returns, Payment, Sizing, Care)
  if (/shipping|delivery time|return|refund|exchange|payment|emi|cod|size guide|measurements|fabric swatch|custom order|bespoke time/i.test(lower)) {
    return { intent: 'FAQ', confidence: 0.8 };
  }

  // 6. AI Recommendation (complex language)
  if (
    /recommend|suggest|what should i wear|which (one )?looks better|confused|help me choose|perfect outfit|sister's wedding/i.test(lower) ||
    lower.split(' ').length > 15 // Very long sentences usually need AI understanding
  ) {
    return { intent: 'AI_RECOMMENDATION', confidence: 0.8 };
  }

  // 7. Product Search (Specific criteria)
  const hasPrice = /rs|inr|₹|\d+\s*(k|lakh|l)\b/i.test(lower);
  const hasColor = /red|blue|green|black|white|yellow|pink|purple|gold|silver|lavender|pastel/i.test(lower);
  const hasOccasion = /wedding|bridal|party|festive/i.test(lower);
  const hasCategory = /lehnga|lehenga|saree|gown|suit|anarkali|sharara|heel|flat|necklace|earring|bangle|ring|jewellery|jewelry|jwellery|jwellary|jewellary|men|mens|male|boy|sherwani|women|womens|female|girl/i.test(lower);

  if (hasCategory && (hasPrice || hasColor || hasOccasion || /under|below|max|between/i.test(lower))) {
    return { intent: 'PRODUCT_SEARCH', confidence: 0.9 };
  }

  // 8. Category Browse (Simple category request)
  if (
    /^(show|shop) (me )?(your )?(a )?(couture|lehenga|lehengas|saree|sarees|jewellery|jewelry|jwellery|jwellary|jewellary|footwear|heels|flats|bridal wear|mens|men|menswear|sherwani)$/i.test(lower.trim()) ||
    /^i want to see (a )?(couture|lehenga|lehengas|saree|sarees|jewellery|jewelry|jwellery|jwellary|jewellary|footwear)$/i.test(lower.trim()) ||
    /^(couture|lehenga|lehengas|saree|sarees|jewellery|jewelry|jwellery|jwellary|jewellary|footwear)$/i.test(lower.trim())
  ) {
    return { intent: 'CATEGORY_BROWSE', confidence: 0.8 };
  }

  // Fallback to search if it just mentions a category (like "I am men")
  if (hasCategory) {
    return { intent: 'PRODUCT_SEARCH', confidence: 0.7 };
  }

  // Default to UNKNOWN (which will trigger AI fallback)
  return { intent: 'UNKNOWN', confidence: 0.0 };
}
