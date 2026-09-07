import React from 'react';
import { Metadata } from 'next';
import ProfileSettingsClient from '@/components/account/ProfileSettingsClient';

export const metadata: Metadata = {
  title: 'Profile Settings | Bespokewala',
  description: 'Manage your profile and account settings.',
};

export default function ProfileSettingsPage() {
  return (
    <div className="account-page-content">
      <div style={{
        backgroundColor: '#fff',
        padding: '2.5rem',
        border: '1px solid #eaeaea',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }} className="luxury-card account-profile-banner">
        <div>
          <h1 style={{
            fontSize: 'clamp(1.1rem, 5vw, 2.5rem)',
            fontWeight: 300,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#000',
            marginBottom: '0.35rem'
          }}>
            Profile Settings
          </h1>
          <p style={{ color: '#888', letterSpacing: '0.08em', fontSize: '0.85rem', textTransform: 'uppercase', margin: 0 }}>
            Manage your personal information and security
          </p>
        </div>
      </div>

      <div style={{ padding: '0 1rem' }}>
        <ProfileSettingsClient />
      </div>
    </div>
  );
}
