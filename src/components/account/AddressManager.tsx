"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Check } from 'lucide-react';

export interface Address {
  _id?: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/account/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error('Failed to fetch addresses', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setCurrentAddress({ country: 'India', isDefault: addresses.length === 0 });
    setIsEditing(true);
    setError(null);
  };

  const handleEdit = (address: Address) => {
    setCurrentAddress(address);
    setIsEditing(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch (e) {
      console.error('Failed to delete address', e);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch (e) {
      console.error('Failed to set default', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCurrentAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const isUpdate = !!currentAddress._id;
    const url = isUpdate 
      ? `/api/account/addresses/${currentAddress._id}` 
      : '/api/account/addresses';
    
    try {
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentAddress)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to save address');
      
      setAddresses(data.addresses);
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>Loading addresses...</div>;
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', margin: 0 }}>
          Saved Addresses
        </h2>
        {!isEditing && (
          <button
            onClick={handleAddNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <Plus size={14} /> Add New
          </button>
        )}
      </div>

      {isEditing ? (
        <div style={{ backgroundColor: '#fff', padding: '2.5rem', border: '1px solid #eaeaea' }} className="luxury-card mobile-p-4">
          <h3 style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>
            {currentAddress._id ? 'Edit Address' : 'Add New Address'}
          </h3>
          
          {error && (
            <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '1rem', marginBottom: '2rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>First Name *</label>
                <input required type="text" name="firstName" value={currentAddress.firstName || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Last Name *</label>
                <input required type="text" name="lastName" value={currentAddress.lastName || ''} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Phone Number *</label>
              <input required type="tel" name="phone" value={currentAddress.phone || ''} onChange={handleChange} style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Address (Street, Apartment, Suite) *</label>
              <input required type="text" name="address" value={currentAddress.address || ''} onChange={handleChange} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>City *</label>
                <input required type="text" name="city" value={currentAddress.city || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>State / Province *</label>
                <input required type="text" name="state" value={currentAddress.state || ''} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Postal Code / ZIP *</label>
                <input required type="text" name="zipCode" value={currentAddress.zipCode || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Country *</label>
                <select required name="country" value={currentAddress.country || 'India'} onChange={handleChange} style={inputStyle}>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="isDefault" 
                name="isDefault" 
                checked={currentAddress.isDefault || false} 
                onChange={handleChange} 
                style={{ width: '16px', height: '16px', accentColor: '#000', cursor: 'pointer' }}
              />
              <label htmlFor="isDefault" style={{ fontSize: '0.85rem', color: '#333', cursor: 'pointer' }}>
                Set as default address
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.85rem 2rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.85rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                style={{
                  padding: '0.85rem 2rem',
                  backgroundColor: 'transparent',
                  color: '#000',
                  border: '1px solid #000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.85rem',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {addresses.length === 0 ? (
            <div style={{
              backgroundColor: '#fff',
              padding: '5rem 2rem',
              textAlign: 'center',
              border: '1px solid #eee'
            }} className="mobile-p-4 mobile-py-8">
              <MapPin size={32} color="#ddd" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                You haven't saved any addresses yet.
              </p>
              <button
                onClick={handleAddNew}
                style={{
                  backgroundColor: 'transparent',
                  color: '#000',
                  border: '1px solid #000',
                  padding: '0.75rem 2rem',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer'
                }}
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {addresses.map((address) => (
                <div 
                  key={address._id}
                  style={{
                    backgroundColor: '#fff',
                    border: address.isDefault ? '1px solid #D4AF37' : '1px solid #eaeaea',
                    padding: '2rem',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  className="luxury-card mobile-p-4"
                >
                  {address.isDefault && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: '#D4AF37',
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Check size={12} /> Default
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 0.5rem 0', color: '#000' }}>
                      {address.firstName} {address.lastName}
                    </h4>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#555', lineHeight: 1.5 }}>
                      {address.address}
                    </p>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#555' }}>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#555' }}>
                      {address.country}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#000' }}>
                      <span style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone: </span> 
                      {address.phone}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eaeaea', paddingTop: '1rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button 
                        onClick={() => handleEdit(address)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#000', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(address._id!)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#c0392b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id!)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: '#888',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          textDecoration: 'underline'
                        }}
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
