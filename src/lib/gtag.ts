/**
 * GA4 / Google Analytics 4 helper module
 *
 * Pattern mirrors the existing MetaPixel.tsx implementation.
 * All events are no-ops when NEXT_PUBLIC_GA_ID is not set or when
 * called server-side, so there are no hydration concerns.
 *
 * Duplicate-purchase guard: trackPurchase checks sessionStorage key
 * `ga4_purchased_{orderId}` before firing to prevent double-firing on
 * re-renders, back-navigation, or React StrictMode double-invoke.
 */

import { readConsent } from '@/lib/consentManager';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Returns true when the user has explicitly granted analytics consent.
 * Falls back to false (deny by default) if no decision has been made.
 */
function isAnalyticsConsented(): boolean {
  const c = readConsent();
  return c?.decided === true && c?.analytics === true;
}

// ─── Type declarations ────────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  price?: number;
  quantity?: number;
  currency?: string;
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Fire a GA4 page_view event. Called on SPA route changes. */
export const pageview = (url: string): void => {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) return;
  if (!isAnalyticsConsented()) return; // consent guard
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

/** Fire any GA4 event. */
export const event = (action: string, params: Record<string, any> = {}): void => {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) return;
  if (!isAnalyticsConsented()) return; // consent guard
  window.gtag('event', action, params);
};

// ─── Ecommerce event helpers ──────────────────────────────────────────────────

/**
 * view_item — product detail page load.
 * Fire once per product mount in ProductViewTracker.tsx.
 */
export const trackViewItem = (product: {
  _id?: string;
  slug: string;
  name: string;
  price?: number;
  category?: string;
  productType?: string;
  subcategory?: string;
}): void => {
  event('view_item', {
    currency: 'INR',
    value: product.price ?? 0,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_category: product.productType ?? '',
        item_category2: product.category ?? '',
        item_category3: product.subcategory ?? '',
        price: product.price ?? 0,
        quantity: 1,
      } satisfies GA4Item,
    ],
  });
};

/**
 * add_to_cart — user successfully added a product to the cart.
 * Fire in ProductClientActions.tsx handleAddToCart(), after addToCart() is called.
 */
export const trackAddToCart = (product: {
  slug: string;
  name: string;
  price: number;
  category?: string;
  productType?: string;
  quantity: number;
}): void => {
  event('add_to_cart', {
    currency: 'INR',
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_category: product.productType ?? '',
        item_category2: product.category ?? '',
        price: product.price,
        quantity: product.quantity,
      } satisfies GA4Item,
    ],
  });
};

/**
 * remove_from_cart — user removed a product from the cart.
 * Fire in CartClient.tsx and MiniCart.tsx before removing.
 */
export const trackRemoveFromCart = (item: {
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
}): void => {
  event('remove_from_cart', {
    currency: 'INR',
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.productSlug,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      } satisfies GA4Item,
    ],
  });
};

/**
 * add_to_wishlist (custom GA4 recommended event).
 * Fire in ProductActions.tsx when adding (not removing) to wishlist.
 */
export const trackAddToWishlist = (product: {
  slug: string;
  name: string;
  price: number;
  category?: string;
  productType?: string;
}): void => {
  event('add_to_wishlist', {
    currency: 'INR',
    value: product.price,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_category: product.productType ?? '',
        item_category2: product.category ?? '',
        price: product.price,
        quantity: 1,
      } satisfies GA4Item,
    ],
  });
};

/**
 * search — user performed a product search.
 * Fire in SearchOverlay.tsx when results are returned.
 */
export const trackSearch = (searchTerm: string): void => {
  event('search', {
    search_term: searchTerm,
  });
};

/**
 * begin_checkout — user enters the checkout page with items in cart.
 * Fire in CheckoutClient.tsx on mount when cart is non-empty.
 */
export const trackBeginCheckout = (
  cartItems: Array<{ productSlug: string; name: string; price: number; quantity: number }>,
  total: number
): void => {
  event('begin_checkout', {
    currency: 'INR',
    value: total,
    items: cartItems.map(item => ({
      item_id: item.productSlug,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    } satisfies GA4Item)),
  });
};

/**
 * add_shipping_info — user successfully saved/confirmed a shipping address.
 * Fire in CheckoutClient.tsx after handleSaveAddress() succeeds.
 */
export const trackAddShippingInfo = (
  cartItems: Array<{ productSlug: string; name: string; price: number; quantity: number }>,
  total: number
): void => {
  event('add_shipping_info', {
    currency: 'INR',
    value: total,
    shipping_tier: 'Standard',
    items: cartItems.map(item => ({
      item_id: item.productSlug,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    } satisfies GA4Item)),
  });
};

/**
 * add_payment_info — user proceeded to the Razorpay payment modal.
 * Fire in CheckoutClient.tsx in handlePayWithRazorpay(), after address
 * validation and before opening the Razorpay modal.
 * NOTE: This is NOT a successful payment event.
 */
export const trackAddPaymentInfo = (
  cartItems: Array<{ productSlug: string; name: string; price: number; quantity: number }>,
  total: number,
  paymentType: string = 'Razorpay'
): void => {
  event('add_payment_info', {
    currency: 'INR',
    value: total,
    payment_type: paymentType,
    items: cartItems.map(item => ({
      item_id: item.productSlug,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    } satisfies GA4Item)),
  });
};

/**
 * purchase — ONLY fires after backend verifies Razorpay payment AND
 * the order has been successfully created in the database.
 *
 * Duplicate prevention: uses sessionStorage key `ga4_purchased_{orderId}`.
 * If the key already exists (re-render, back-navigation, React StrictMode),
 * the event is silently skipped.
 *
 * Fire in checkout/success/page.tsx after fetching the verified order data.
 */
export const trackPurchase = (
  order: {
    items: Array<{ slug?: string; productSlug?: string; name: string; price: number; quantity: number }>;
    total: number;
    shipping?: number;
    tax?: number;
    coupon?: string;
  },
  orderId: string
): void => {
  if (typeof window === 'undefined') return;

  // Duplicate guard — prevents re-firing on React StrictMode, re-renders,
  // back-navigation, and payment callback loops.
  const guardKey = `ga4_purchased_${orderId}`;
  if (sessionStorage.getItem(guardKey)) return;
  sessionStorage.setItem(guardKey, '1');

  event('purchase', {
    transaction_id: orderId,
    currency: 'INR',
    value: order.total,
    shipping: order.shipping ?? 0,
    tax: order.tax ?? 0,
    ...(order.coupon ? { coupon: order.coupon } : {}),
    items: order.items.map(item => ({
      item_id: item.slug ?? item.productSlug ?? '',
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    } satisfies GA4Item)),
  });
};

// ─── Custom Bespokewala events ────────────────────────────────────────────────

/**
 * virtual_try_on — fires after a successful Virtual Try-On result is received.
 * Personal data (user photo) must NEVER be passed to this function.
 */
export const trackVirtualTryOn = (product: {
  productId?: string;
  productName?: string;
  productCategory?: string;
  productPrice?: number;
}): void => {
  event('virtual_try_on', {
    item_id: product.productId ?? '',
    item_name: product.productName ?? '',
    item_category: product.productCategory ?? '',
    value: product.productPrice ?? 0,
    currency: 'INR',
  });
};

/**
 * chat_with_stylist — fires when the user clicks "Chat with Stylist".
 * The WhatsApp navigation continues unchanged after this fires.
 */
export const trackChatWithStylist = (product: {
  slug: string;
  name: string;
  category?: string;
  productType?: string;
}): void => {
  event('chat_with_stylist', {
    item_id: product.slug,
    item_name: product.name,
    item_category: product.productType ?? '',
    item_category2: product.category ?? '',
  });
};

/**
 * product_filter — fires when a filter is applied on a collection/listing page.
 */
export const trackProductFilter = (filterKey: string, filterValue: string): void => {
  event('product_filter', {
    filter_type: filterKey,
    filter_value: filterValue,
  });
};

/**
 * product_sort — fires when a sort option is selected.
 */
export const trackProductSort = (sortValue: string): void => {
  event('product_sort', {
    sort_by: sortValue,
  });
};

/**
 * size_selection — fires when a user selects a size on a product page.
 */
export const trackSizeSelection = (product: {
  slug: string;
  name: string;
}, size: string): void => {
  event('size_selection', {
    item_id: product.slug,
    item_name: product.name,
    size,
  });
};

/**
 * category_selection — fires when a user navigates to a product category.
 */
export const trackCategorySelection = (category: string, productType?: string): void => {
  event('category_selection', {
    category,
    product_type: productType ?? '',
  });
};
