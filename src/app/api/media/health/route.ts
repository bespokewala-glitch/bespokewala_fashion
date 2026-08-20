import { NextResponse } from 'next/server';
import { bucket, bucketName } from '@/lib/gcs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/media/health
 *
 * Safe production diagnostic — checks GCS connectivity without exposing
 * any credentials or secret values. Returns only boolean pass/fail per check.
 *
 * Hit this URL after deploying to Vercel to confirm GCS is reachable:
 *   https://www.bespokewala.com/api/media/health
 */
export async function GET() {
  const checks: Record<string, boolean | string> = {};

  // 1. Env var presence (no values exposed)
  checks.env_project_id    = !!process.env.GOOGLE_CLOUD_PROJECT_ID;
  checks.env_client_email  = !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  checks.env_bucket_name   = !!process.env.GOOGLE_CLOUD_BUCKET_NAME;

  // 2a. Preferred: full JSON blob (GOOGLE_APPLICATION_CREDENTIALS_JSON)
  const jsonBlob = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ?? '';
  checks.env_json_creds_present = jsonBlob.length > 0;
  if (jsonBlob.length > 0) {
    try {
      const parsed = JSON.parse(jsonBlob);
      checks.env_json_creds_has_project_id   = !!parsed.project_id;
      checks.env_json_creds_has_client_email  = !!parsed.client_email;
      checks.env_json_creds_has_private_key   = !!parsed.private_key;
    } catch {
      checks.env_json_creds_parse_error = true;
    }
  }

  // 2b. Legacy: individual private key checks
  const rawKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? '';
  checks.env_private_key_present     = rawKey.length > 0;
  checks.env_private_key_has_begin   = rawKey.includes('BEGIN PRIVATE KEY');
  checks.env_private_key_has_end     = rawKey.includes('END PRIVATE KEY');
  checks.env_private_key_has_newlines = rawKey.includes('\n');
  checks.env_private_key_has_literal_backslash_n = rawKey.includes('\\n');

  // 3. Bucket name
  checks.bucket_name = bucketName || '(empty)';

  // 4. GCS connectivity — try a lightweight metadata call
  try {
    const [exists] = await bucket.exists();
    checks.gcs_bucket_reachable = exists;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    checks.gcs_bucket_reachable = false;
    checks.gcs_error = msg.substring(0, 200); // truncated — no secrets in error messages
  }

  const allGood = checks.env_project_id &&
    checks.env_client_email &&
    checks.env_private_key_present &&
    checks.env_private_key_has_begin &&
    checks.env_private_key_has_end &&
    checks.gcs_bucket_reachable === true;

  return NextResponse.json(
    { status: allGood ? 'ok' : 'degraded', checks },
    { status: allGood ? 200 : 503 },
  );
}
