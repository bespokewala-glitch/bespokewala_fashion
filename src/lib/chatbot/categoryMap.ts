export function detectCategory(text: string): { productType?: string; category?: string; subcategory?: string; occasion?: string; colors?: string } {
  const result: { productType?: string; category?: string; subcategory?: string; occasion?: string; colors?: string } = {};
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
    result.subcategory = 'lehenga';
    result.category = 'womens';
    result.productType = 'couture';
  } else if (/saree|sari|shari/.test(lower)) {
    result.subcategory = 'sarees';
    result.category = 'womens';
    result.productType = 'couture';
  } else if (/gown|dress|maxi/.test(lower)) {
    result.subcategory = 'gowns';
    result.category = 'womens';
    result.productType = 'couture';
  } else if (/suit|anarkali|salwar|kurta|kurti/.test(lower)) {
    result.subcategory = 'suits';
    result.category = 'womens';
    result.productType = 'couture';
  } else if (/sharara|gharara/.test(lower)) {
    result.subcategory = 'sharara';
    result.category = 'womens';
    result.productType = 'couture';
  } else if (/heel|pump|stiletto|wedge/.test(lower)) {
    result.subcategory = 'heels';
    result.productType = 'footwear';
  } else if (/flat|sandal|jutti|mojari/.test(lower)) {
    result.subcategory = 'flats';
    result.productType = 'footwear';
  } else if (/necklace|choker|chain/.test(lower)) {
    result.subcategory = 'necklace';
    result.productType = 'jewellery';
  } else if (/earring|jhumka|stud/.test(lower)) {
    result.subcategory = 'earrings';
    result.productType = 'jewellery';
  } else if (/bangle|bracelet|kada/.test(lower)) {
    result.subcategory = 'bangles';
    result.productType = 'jewellery';
  } else if (/ring/.test(lower)) {
    result.subcategory = 'rings';
    result.productType = 'jewellery';
  } else if (/footwear|shoe|heel|flat|sandal/i.test(lower)) {
    result.productType = 'footwear'; // Generic footwear
  } else if (/jewellery|jewelry|jwellery|jwellary|jewellary|necklace|earring|bangle|ring/i.test(lower)) {
    result.productType = 'jewellery'; // Generic jewellery
  } else if (/couture|clothes|clothing|outfit|\bwear\b/i.test(lower)) {
    result.productType = 'couture'; // Generic couture
  }

  // 4. Detect Gender/Category overrides
  if (/\b(men|mens|male|boy|boys|sherwani)\b/i.test(lower)) {
    result.category = 'mens';
  } else if (/\b(women|womens|female|girl|girls)\b/i.test(lower)) {
    result.category = 'womens';
  }

  return result;
}
