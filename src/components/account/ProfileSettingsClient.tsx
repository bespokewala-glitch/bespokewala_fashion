"use client";

import React, { useState, useEffect } from 'react';

export default function ProfileSettingsClient() {
  const [profile, setProfile] = useState({ name: '', email: '', mobileNumber: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/account/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({ name: data.name, email: data.email, mobileNumber: data.mobileNumber || '' });
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassword(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, mobileNumber: profile.mobileNumber })
      });
      const data = await res.json();
      
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (e: any) {
      setProfileMsg({ type: 'error', text: e.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });

    if (password.newPassword !== password.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      setSavingPassword(false);
      return;
    }

    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: password.currentPassword, 
          newPassword: password.newPassword 
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (e: any) {
      setPasswordMsg({ type: 'error', text: e.message });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>Loading profile...</div>;
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem",
    border: "1px solid #e0e0e0",
    backgroundColor: "#fafafa",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s"
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', 
    fontSize: '0.75rem', 
    color: '#666', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em', 
    marginBottom: '0.5rem'
  };

  const btnStyle: React.CSSProperties = {
    padding: '0.85rem 2.5rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.85rem',
    transition: 'opacity 0.2s'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Personal Information Form */}
      <div style={{ backgroundColor: '#fff', padding: '2.5rem', border: '1px solid #eaeaea' }} className="luxury-card mobile-p-4">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
          Personal Information
        </h2>

        {profileMsg.text && (
          <div style={{ 
            backgroundColor: profileMsg.type === 'success' ? '#edf7ed' : '#ffebee', 
            color: profileMsg.type === 'success' ? '#1e4620' : '#c62828', 
            padding: '1rem', 
            marginBottom: '2rem', 
            fontSize: '0.85rem' 
          }}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 250px' }}>
              <label style={labelStyle}>Full Name *</label>
              <input required type="text" name="name" value={profile.name} onChange={handleProfileChange} style={inputStyle} />
            </div>
            <div style={{ flex: '1 1 250px' }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" name="email" value={profile.email} disabled style={{ ...inputStyle, backgroundColor: '#f0f0f0', color: '#888', cursor: 'not-allowed' }} title="Email cannot be changed" />
            </div>
          </div>
          
          <div style={{ flex: '1 1 250px' }}>
            <label style={labelStyle}>Mobile Number</label>
            <input type="tel" name="mobileNumber" value={profile.mobileNumber} onChange={handleProfileChange} style={inputStyle} />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={savingProfile}
              style={{ ...btnStyle, cursor: savingProfile ? 'not-allowed' : 'pointer', opacity: savingProfile ? 0.7 : 1 }}
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Management Form */}
      <div style={{ backgroundColor: '#fff', padding: '2.5rem', border: '1px solid #eaeaea' }} className="luxury-card mobile-p-4">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
          Change Password
        </h2>

        {passwordMsg.text && (
          <div style={{ 
            backgroundColor: passwordMsg.type === 'success' ? '#edf7ed' : '#ffebee', 
            color: passwordMsg.type === 'success' ? '#1e4620' : '#c62828', 
            padding: '1rem', 
            marginBottom: '2rem', 
            fontSize: '0.85rem' 
          }}>
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
          <div>
            <label style={labelStyle}>Current Password *</label>
            <input required type="password" name="currentPassword" value={password.currentPassword} onChange={handlePasswordChange} style={inputStyle} />
          </div>
          
          <div>
            <label style={labelStyle}>New Password *</label>
            <input required type="password" name="newPassword" value={password.newPassword} onChange={handlePasswordChange} style={inputStyle} minLength={6} />
          </div>
          
          <div>
            <label style={labelStyle}>Confirm New Password *</label>
            <input required type="password" name="confirmPassword" value={password.confirmPassword} onChange={handlePasswordChange} style={inputStyle} minLength={6} />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={savingPassword}
              style={{ ...btnStyle, cursor: savingPassword ? 'not-allowed' : 'pointer', opacity: savingPassword ? 0.7 : 1 }}
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
}
