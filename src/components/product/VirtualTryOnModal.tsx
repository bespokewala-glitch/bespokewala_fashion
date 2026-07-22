"use client";

import React, { useState, useRef } from 'react';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  garmentImageUrl: string;
}

export default function VirtualTryOnModal({ isOpen, onClose, garmentImageUrl }: VirtualTryOnModalProps) {
  const [userImageBase64, setUserImageBase64] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('dresses');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImageBase64(reader.result as string);
        setResultImage(null); // Reset result if new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!userImageBase64) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userImageBase64,
          garmentImageUrl,
          category
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      setResultImage(data.resultImageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: '"Jost", sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500, color: '#000' }}>Virtual Try-On</h2>
          <button 
            onClick={onClose} 
            style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000' }}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 500 }}>1. Upload Your Photo</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              For best results, upload a clear, front-facing photo showing your body (arms down).
            </p>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #ccc',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '1rem',
                background: '#fafafa'
              }}
            >
              {userImageBase64 ? (
                <img src={userImageBase64} alt="User upload" style={{ maxHeight: '250px', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#888' }}>Click to upload your photo</div>
              )}
            </div>

            {userImageBase64 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Garment Type</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd' }}
                >
                  <option value="dresses">Dress / Full Body</option>
                  <option value="upper_body">Upper Body / Tops</option>
                  <option value="lower_body">Lower Body / Bottoms</option>
                </select>
              </div>
            )}
            
            <button 
              onClick={handleTryOn}
              disabled={!userImageBase64 || loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: userImageBase64 && !loading ? '#000' : '#ccc',
                color: '#fff',
                border: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: userImageBase64 && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>Generating... Please wait</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"></path>
                    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.35 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"></path>
                  </svg>
                  Generate Try-On
                </>
              )}
            </button>

            {error && (
              <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '1rem', padding: '1rem', background: '#fee' }}>
                {error}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 500 }}>2. Result</h3>
            <div style={{
                border: '1px solid #eee',
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9f9f9'
              }}>
              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #000', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>AI is rendering your fit...<br/>This can take up to 30 seconds.</p>
                </div>
              ) : resultImage ? (
                <img src={resultImage} alt="Virtual Try On Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                  Your generated image will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
