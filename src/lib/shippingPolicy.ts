export function getShippingEstimate(productType?: string, category?: string, subcategory?: string): string {
  const typeLower = (productType || '').toLowerCase();
  const catLower = (category || '').toLowerCase();
  const subLower = (subcategory || '').toLowerCase();
  
  const combined = `${typeLower} ${catLower} ${subLower}`;

  if (combined.includes('footwear')) {
    return '15-20 days';
  }
  
  if (combined.includes('couture') || combined.includes('lehenga') || combined.includes('gown')) {
    return '40-50 days';
  }

  // Default standard shipping for ready-to-wear / accessories
  return '7-14 days';
}
