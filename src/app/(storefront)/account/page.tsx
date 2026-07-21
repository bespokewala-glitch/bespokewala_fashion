import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    paddingTop: '8rem',
    paddingBottom: '4rem',
    paddingLeft: '2rem',
    paddingRight: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '3rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.25rem',
    fontWeight: 300,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
    color: '#1c1c1c',
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    letterSpacing: '0.05em',
  };

  const gridStyle: React.CSSProperties = {
    display: 'flex',
    gap: '2rem',
    flexDirection: 'row',
  };

  const sidebarStyle: React.CSSProperties = {
    flex: '1',
    borderRight: '1px solid #f3f4f6',
    paddingRight: '2rem',
  };

  const mainContentStyle: React.CSSProperties = {
    flex: '3',
  };

  const navItemStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#6b7280',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    textDecoration: 'none',
  };

  const activeNavItemStyle: React.CSSProperties = {
    ...navItemStyle,
    color: '#1c1c1c',
    fontWeight: 600,
    borderBottom: '1px solid #1c1c1c',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 300,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '2rem',
    color: '#1c1c1c',
  };

  const emptyStateStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    padding: '2rem',
    textAlign: 'center',
    border: '1px solid #f3f4f6',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>My Account</h1>
        <p style={subtitleStyle}>Welcome back, {user.name}</p>
      </div>

      <div style={gridStyle}>
        <div style={sidebarStyle}>
          <nav>
            <a href="#" style={activeNavItemStyle}>
              Order History
            </a>
            <a href="#" style={navItemStyle}>
              Profile Settings
            </a>
            <a href="#" style={navItemStyle}>
              Addresses
            </a>
          </nav>
        </div>
        
        <div style={mainContentStyle}>
          <h2 style={sectionTitleStyle}>Recent Orders</h2>
          <div style={emptyStateStyle}>
            <p style={subtitleStyle}>You haven't placed any orders yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
