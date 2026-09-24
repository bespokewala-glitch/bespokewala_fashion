const buildInQuery = (val) => {
  const arr = val.split(',').map(v => v.trim()).filter(Boolean);
  if (arr.length === 0) return undefined;
  return { $in: arr.map(item => new RegExp(`^${item.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\\\$&')}$`, 'i')) };
};

function test(params) {
  const { productType, category, subcategory, isNewArrival } = params;
  const productQuery = {};

  let finalIsNewArrival = isNewArrival === 'true';

  const extractNewArrival = (val) => {
    if (val?.toLowerCase() === 'new-arrivals') {
      finalIsNewArrival = true;
      return undefined;
    }
    return val;
  };

  const qCategory = extractNewArrival(category);
  const qSubcategory = extractNewArrival(subcategory);

  if (productType) productQuery.productType = buildInQuery(productType);

  if (qCategory && qCategory.toLowerCase() !== 'all' && qCategory.toLowerCase() !== 'all-products' && qCategory.toLowerCase() !== 'all-collections') {
      productQuery.category = buildInQuery(qCategory);
  }

  if (finalIsNewArrival) {
    productQuery.isNewArrival = true;
  }

  console.log(JSON.stringify(productQuery, (key, val) => {
    if (val instanceof RegExp) return val.toString();
    return val;
  }, 2));
}

console.log("Main /new-arrivals");
test({ productType: 'Couture', isNewArrival: 'true' });

console.log("\\n/products/jewellery/new-arrivals");
test({ productType: 'jewellery', category: 'new-arrivals' });

console.log("\\n/products/footwear/new-arrivals");
test({ productType: 'footwear', category: 'new-arrivals' });
