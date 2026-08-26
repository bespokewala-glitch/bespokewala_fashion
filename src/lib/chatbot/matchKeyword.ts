export interface FAQEntry {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}

export function matchByKeyword(userMessage: string, faqList: FAQEntry[]): FAQEntry | null {
  const normalizedMessage = userMessage.toLowerCase();
  
  // Tokenize user message into words
  const words = normalizedMessage.split(/[\s,.-?!]+/).filter(w => w.length > 0);
  
  let bestMatch: FAQEntry | null = null;
  let highestScore = 0;

  for (const faq of faqList) {
    let score = 0;
    
    // Check if FAQ keywords appear in the user's message
    for (const keyword of faq.keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      // Handle multi-word keywords
      if (normalizedKeyword.includes(' ')) {
        if (normalizedMessage.includes(normalizedKeyword)) {
          score += 1;
        }
      } else {
        // Single word keywords
        if (words.includes(normalizedKeyword)) {
          score += 1;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  }

  return highestScore >= 1 ? bestMatch : null;
}
