export function detectCategory(text: string): { productType?: string; category?: string; occasion?: string; colors?: string } {
  const result: { productType?: string; category?: string; occasion?: string; colors?: string } = {};
  const lower = text.toLowerCase();

  // 1. Detect Occasion
  if (/wedding|bridal|bride|marriage|reception/.test(lower)) result.occasion = 'wedding';
  else if (/party|cocktail|evening/.test(lower)) result.occasion = 'party';
  else if (/festive|festival|diwali|eid|navratri|pooja/.test(lower)) result.occasion = 'festive';
  else if (/casual|daily/.test(lower)) result.occasion = 'casual';

  // 2. Detect Color (simple lookup)
  const commonColors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'gold', 'silver', 'lavender', 'pastel', 'maroon', 'ivory', 'beige'];
  for (const color of commonColors) {
    if (new RegExp(`\\b${color}\\b`).test(lower)) {
      result.colors = color;
      break; // Just grab the first mentioned color
    }
  }

  // 3. Detect Category & ProductType
  if (/lehnga|lehenga|ghagra|chaniya/.test(lower)) {
    result.category = 'Lehenga';
    result.productType = 'couture';
  } else if (/saree|sari|shari/.test(lower)) {
    result.category = 'Saree';
    result.productType = 'couture';
  } else if (/gown|dress|maxi/.test(lower)) {
    result.category = 'Gown';
    result.productType = 'couture';
  } else if (/suit|anarkali|salwar|kurta|kurti/.test(lower)) {
    result.category = 'Suit';
    result.productType = 'couture';
  } else if (/sharara|gharara/.test(lower)) {
    result.category = 'Sharara';
    result.productType = 'couture';
  } else if (/heel|pump|stiletto|wedge/.test(lower)) {
    result.category = 'Heels';
    result.productType = 'footwear';
  } else if (/flat|sandal|jutti|mojari/.test(lower)) {
    result.category = 'Flats';
    result.productType = 'footwear';
  } else if (/necklace|choker|chain/.test(lower)) {
    result.category = 'Necklace';
    result.productType = 'jewellery';
  } else if (/earring|jhumka|stud/.test(lower)) {
    result.category = 'Earrings';
    result.productType = 'jewellery';
  } else if (/bangle|bracelet|kada/.test(lower)) {
    result.category = 'Bangles';
    result.productType = 'jewellery';
  } else if (/ring/.test(lower)) {
    result.category = 'Rings';
    result.productType = 'jewellery';
  } else if (/footwear|shoe|heel|flat|sandal/i.test(lower)) {
    result.productType = 'footwear'; // Generic footwear
  } else if (/jewellery|jewelry|jwellery|jwellary|jewellary|necklace|earring|bangle|ring/i.test(lower)) {
    result.productType = 'jewellery'; // Generic jewellery
  } else if (/couture|clothes|clothing|outfit|\bwear\b/i.test(lower)) {
    result.productType = 'couture'; // Generic couture
  }

  return result;
}
