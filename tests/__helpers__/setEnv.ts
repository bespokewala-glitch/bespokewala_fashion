/**
 * Sets test environment variables before any module is loaded.
 * Used as jest `setupFiles` (runs before the test framework is installed).
 */
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bespokewala_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production';
(process.env as any).NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret_placeholder';
// Suppress analytics/meta pixel in tests
process.env.NEXT_PUBLIC_GA_ID = '';
process.env.META_ACCESS_TOKEN = '';
