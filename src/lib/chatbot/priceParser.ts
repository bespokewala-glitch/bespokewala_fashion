export function extractPrice(text: string): { minPrice?: number; maxPrice?: number } {
  const result: { minPrice?: number; maxPrice?: number } = {};
  const lower = text.toLowerCase();

  // Handle patterns like "under 50k", "below 1 lakh", "less than 80000"
  const maxMatches = lower.match(/(?:under|below|less than|max|up to|upto)\s*(?:rs|inr|₹)?\s*([\d.,]+)\s*(k|lakh|l)?/i);
  if (maxMatches) {
    result.maxPrice = parseNumericString(maxMatches[1], maxMatches[2]);
  }

  // Handle patterns like "over 50k", "above 1 lakh", "more than 80000"
  const minMatches = lower.match(/(?:over|above|more than|min|starting from)\s*(?:rs|inr|₹)?\s*([\d.,]+)\s*(k|lakh|l)?/i);
  if (minMatches) {
    result.minPrice = parseNumericString(minMatches[1], minMatches[2]);
  }

  // Handle patterns like "between 50k and 1 lakh"
  const rangeMatches = lower.match(/between\s*(?:rs|inr|₹)?\s*([\d.,]+)\s*(k|lakh|l)?\s*(?:and|to|-)\s*(?:rs|inr|₹)?\s*([\d.,]+)\s*(k|lakh|l)?/i);
  if (rangeMatches) {
    result.minPrice = parseNumericString(rangeMatches[1], rangeMatches[2]);
    result.maxPrice = parseNumericString(rangeMatches[3], rangeMatches[4]);
  }

  // If no relational words, just look for a price pattern and assume maxPrice
  if (!result.maxPrice && !result.minPrice) {
    const directMatch = lower.match(/(?:rs|inr|₹)\s*([\d.,]+)\s*(k|lakh|l)?/i);
    if (directMatch) {
      result.maxPrice = parseNumericString(directMatch[1], directMatch[2]);
    } else {
      // Look for plain numbers with k or lakh
      const plainMatch = lower.match(/(?:^|\s)([\d.,]+)\s*(k|lakh|l)(?:\s|$)/i);
      if (plainMatch) {
        result.maxPrice = parseNumericString(plainMatch[1], plainMatch[2]);
      }
    }
  }

  return result;
}

function parseNumericString(numStr: string, multiplier?: string): number {
  let num = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(num)) return 0;

  const mult = multiplier?.toLowerCase() || '';
  if (mult === 'k') num *= 1000;
  if (mult === 'lakh' || mult === 'l') num *= 100000;

  return num;
}
