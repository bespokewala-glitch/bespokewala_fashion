'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, KeyRound, Lock } from 'lucide-react';

/** The three steps of the flow */
type Step = 'request' | 'verify' | 'reset';

// ── Reusable error banner ───────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '1rem', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fee2e2', borderRadius: '4px' }}>
      {message}
    </div>
  );
}

// ── Success banner ──────────────────────────────────────────────────────────
function SuccessBanner({ message }: { message: string }) {
  return (
    <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '1rem', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
      {message}
    </div>
  );
}

// ── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'request', label: 'Email', icon: <Mail size={14} /> },
    { key: 'verify', label: 'Code', icon: <KeyRound size={14} /> },
    { key: 'reset', label: 'Password', icon: <Lock size={14} /> },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i <= currentIdx ? '#1a1a1a' : '#e5e7eb',
              color: i <= currentIdx ? '#c8a96e' : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              {s.icon}
            </div>
            <span style={{ fontSize: '0.65rem', color: i <= currentIdx ? '#1a1a1a' : '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 40, height: 1, background: i < currentIdx ? '#1a1a1a' : '#e5e7eb', marginBottom: 20, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── OTP digit inputs ─────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    onChange(next.join(''));
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
            border: `2px solid ${digits[i] ? '#1a1a1a' : '#d1d5db'}`,
            borderRadius: 6, outline: 'none', fontFamily: 'monospace',
            background: '#fff', color: '#1a1a1a', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#c8a96e'}
          onBlur={(e) => e.target.style.borderColor = digits[i] ? '#1a1a1a' : '#d1d5db'}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  function startCooldown(seconds: number) {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  // ── Step 1: Request OTP ─────────────────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setInfo('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.status === 429 && data.cooldownSeconds) {
        startCooldown(data.cooldownSeconds);
        setError(data.error);
      } else if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setInfo(data.message);
        setStep('verify');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1 resend ────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true); setError(''); setInfo('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.status === 429 && data.cooldownSeconds) {
        startCooldown(data.cooldownSeconds);
        setError(data.error);
      } else if (!res.ok) {
        setError(data.error || 'Could not resend code.');
      } else {
        setInfo('A new code has been sent to your email.');
        setOtp('');
        startCooldown(60);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP + reset password ─────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');

    if (otp.replace(/\D/g, '').length !== 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        if (data.attemptsLeft === 0) {
          // OTP locked — go back to request step
          setTimeout(() => { setStep('request'); setOtp(''); setError(''); }, 2500);
        }
      } else {
        setDone(true);
        setTimeout(() => router.push('/login'), 2500);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">

        <div className="auth-header">
          <div className="auth-brand">Bespokewala</div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            {step === 'request' && 'Enter your email to receive a reset code'}
            {step === 'verify' && 'Enter the code and your new password'}
          </p>
          <div className="auth-divider"></div>
        </div>

        <StepIndicator step={done ? 'reset' : step} />

        {error && <ErrorBanner message={error} />}
        {info && !error && <SuccessBanner message={info} />}

        {done ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ color: '#16a34a', fontSize: '1.25rem', marginBottom: '1rem' }}>✓ Password reset successfully</div>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>Redirecting to sign in...</p>
          </div>

        ) : step === 'request' ? (
          /* ── Step 1: Email entry ── */
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" disabled={loading || cooldown > 0} className="auth-button">
              {loading ? 'Sending Code...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'SEND RESET CODE'}
            </button>
          </form>

        ) : (
          /* ── Step 2: OTP + new password ── */
          <form onSubmit={handleReset} className="auth-form">

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="auth-label" style={{ display: 'block', textAlign: 'center', marginBottom: '0.75rem' }}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </label>
              <OtpInput value={otp} onChange={setOtp} />

              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || cooldown > 0}
                  style={{ background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer', color: cooldown > 0 ? '#9ca3af' : '#1a1a1a', fontSize: '0.8125rem', textDecoration: cooldown > 0 ? 'none' : 'underline', padding: 0 }}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('request'); setOtp(''); setError(''); setInfo(''); }}
                style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8125rem', padding: 0 }}
              >
                ← Change email
              </button>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  required
                  minLength={6}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                  required
                  minLength={6}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || otp.replace(/\D/g, '').length !== 6} className="auth-button">
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}

        <Link href="/login" className="auth-footer-link" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
          Remember your password? <span>Sign In</span>
        </Link>
      </div>
    </div>
  );
}
