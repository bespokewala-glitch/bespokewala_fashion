import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { verifySmtpConnection, sendTestEmail } from '@/lib/email';

/**
 * GET /api/admin/email/test
 * Diagnostic endpoint to verify SMTP configuration and connection status.
 */
export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    const result = await verifySmtpConnection();
    return NextResponse.json({
      success: result.valid,
      configured: result.configured,
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : null,
      from: process.env.EMAIL_FROM || null,
      adminTo: process.env.EMAIL_ADMIN_TO || null,
      error: result.error || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

/**
 * POST /api/admin/email/test
 * Sends a live branded test email to verify end-to-end delivery.
 * Body: { to?: string }
 */
export async function POST(request: Request) {
  try {
    const rl = await checkAdminRateLimit(request, 'adminSensitive');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { errorResponse, user } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    let targetEmail: string | undefined;
    try {
      const body = await request.json();
      targetEmail = body?.to;
    } catch {
      // Body may be empty
    }

    const recipient = targetEmail || user?.email || process.env.EMAIL_ADMIN_TO || process.env.SMTP_USER;
    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required (or set EMAIL_ADMIN_TO in .env.local).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return NextResponse.json({ success: false, error: 'Invalid recipient email address.' }, { status: 400 });
    }

    const result = await sendTestEmail(recipient);

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'system.settings_updated',
      target_type: 'system',
      meta: {
        operation: 'email_test_dispatch',
        recipient,
        success: result.success,
      },
      req: request,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      recipient,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

