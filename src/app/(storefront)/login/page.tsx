"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

      // Check if there is a redirect parameter in the URL
      const redirectPath = searchParams.get('redirect');
      const destination = redirectPath
        ? redirectPath
        : (data.user.role === 'admin' ? '/dashboard/campaigns' : '/account');

      router.push(destination);
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    paddingTop: '10rem',
    paddingBottom: '4rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    backgroundColor: '#FAFAFA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '28rem',
    width: '100%',
    backgroundColor: '#ffffff',
    padding: '3rem 2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '2.5rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 300,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
    color: '#1c1c1c',
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '1rem',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
    border: '1px solid #fee2e2',
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#374151',
    marginBottom: '0.5rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #d1d5db',
    padding: '0.5rem 0',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontSize: '1rem',
    backgroundColor: 'transparent',
    color: '#1c1c1c',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#1c1c1c',
    color: '#ffffff',
    padding: '1rem 0',
    fontSize: '0.875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    marginTop: '1rem',
    transition: 'background-color 0.2s',
  };

  const linkStyle: React.CSSProperties = {
    display: 'block',
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    textDecoration: 'none',
    letterSpacing: '0.05em',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Login</h1>
          <p style={subtitleStyle}>Access your account</p>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={formStyle}>
          <div>
            <label style={labelStyle}>
              Email Address or Mobile Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={inputStyle}
              required
              onFocus={(e) => e.target.style.borderBottomColor = '#1c1c1c'}
              onBlur={(e) => e.target.style.borderBottomColor = '#d1d5db'}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
              onFocus={(e) => e.target.style.borderBottomColor = '#1c1c1c'}
              onBlur={(e) => e.target.style.borderBottomColor = '#d1d5db'}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#374151')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1c1c1c')}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <Link href="/register" style={linkStyle}>
          Don't have an account? <span style={{ color: '#1c1c1c', borderBottom: '1px solid #1c1c1c' }}>Register</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
