"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Eye, EyeOff } from 'lucide-react';

function LoginContent() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const redirectPath = searchParams.get('redirect');
      const destination = redirectPath
        ? redirectPath
        : (data.user.role === 'admin' ? '/dashboard/campaigns' : '/account');

      window.location.href = destination;

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        
        <div className="auth-header">
          <div className="auth-brand">Bespokewala</div>
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Access your account</p>
          <div className="auth-divider"></div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '1rem', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">
              Email Address or Mobile Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          
          <div className="auth-input-group">
            <label className="auth-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <Link href="/forgot-password" className="auth-link-subtle">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Signing In...' : 'SIGN IN'}
          </button>
        </form>

        <Link href="/register" className="auth-footer-link">
          Don't have an account? <span>Register</span>
        </Link>
      </div>
    </div>
  );
}

// Static shell rendered during SSR — identical structure to LoginContent.
// Avoids the "Loading..." flash while the client component hydrates.
function LoginShell() {
  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-brand">Bespokewala</div>
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Access your account</p>
          <div className="auth-divider"></div>
        </div>
        <div className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Email Address or Mobile Number</label>
            <input type="text" className="auth-input" readOnly />
          </div>
          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input type="password" className="auth-input" readOnly style={{ paddingRight: '2.5rem' }} />
            </div>
          </div>
          <button type="button" className="auth-button">SIGN IN</button>
        </div>
        <a href="/register" className="auth-footer-link">
          Don&apos;t have an account? <span>Register</span>
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginContent />
    </Suspense>
  );
}
