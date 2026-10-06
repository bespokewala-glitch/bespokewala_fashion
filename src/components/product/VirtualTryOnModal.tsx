'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { trackVirtualTryOn } from '@/lib/gtag';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productImage: string;
  // Optional product context for GA4 analytics (personal data must NOT be passed)
  productId?: string;
  productName?: string;
  productCategory?: string;
  productPrice?: number;
}

export default function VirtualTryOnModal({ isOpen, onClose, productImage, productId, productName, productCategory, productPrice }: VirtualTryOnModalProps) {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Creating your look...');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setUserImage(null);
      setGeneratedImage(null);
      setError(null);
      setIsLoading(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please upload an image smaller than 5MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTryOn = async () => {
    if (!userImage) {
      setError('Please upload your photo first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMsg('Creating your look...');

    // Progressive loading messages so the user knows we're still working
    const messages = [
      'Creating your look...',
      'Analyzing your photo...',
      'Fitting the garment...',
      'Adding finishing touches...',
      'Almost ready...',
    ];
    let msgIndex = 0;
    loadingTimerRef.current = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, messages.length - 1);
      setLoadingMsg(messages[msgIndex]);
    }, 12000); // advance message every 12 seconds

    try {
      const fullProductUrl = productImage?.startsWith('/')
        ? `${window.location.origin}${productImage}`
        : productImage;

      const response = await fetch('/api/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImageBase64: userImage,
          productImageUrl: fullProductUrl,
          category: productCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'The try-on service is temporarily busy. Please try again in a moment.';
        if (data.error) {
          errorMessage = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
        } else if (data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      const jobId = data.id;
      if (!jobId) {
        throw new Error('Invalid response from server.');
      }

      // Poll with 5s interval, max 3 minutes total
      let isCompleted = false;
      const maxWaitMs = 3 * 60 * 1000;
      const startTime = Date.now();

      while (!isCompleted) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        if (Date.now() - startTime > maxWaitMs) {
          throw new Error('The try-on is taking longer than expected. Please try again.');
        }

        const pollResponse = await fetch('/api/virtual-try-on', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });

        const pollData = await pollResponse.json();

        if (!pollResponse.ok) {
          throw new Error(pollData.error || 'Failed to check status.');
        }

        if (pollData.status === 'completed') {
          isCompleted = true;
          const outputUrl = pollData.outputs?.[0] || pollData.output_image_url || pollData.output;
          if (outputUrl) {
            setGeneratedImage(outputUrl);
            // GA4 virtual_try_on — fires only after successful result.
            // NOTE: user photo (base64) is intentionally NOT passed.
            trackVirtualTryOn({
              productId,
              productName,
              productCategory,
              productPrice,
            });
          } else {
            throw new Error('Failed to retrieve the generated image.');
          }
        } else if (pollData.status === 'failed') {
          isCompleted = true;
          throw new Error(pollData.error?.message || 'Virtual Try-On failed.');
        }
        // status: queued | processing → keep polling
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setGeneratedImage(null);
    setUserImage(null);
    setError(null);
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <>
      <style>{`
        .vto-overlay {
          position: fixed !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background-color: rgba(0, 0, 0, 0.75) !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
        }
        .vto-box {
          background: #fff;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 8px;
          padding: 28px;
          box-sizing: border-box;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          position: relative;
        }
        .vto-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .vto-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #111;
        }
        .vto-x {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #111;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          flex-shrink: 0;
        }
        .vto-x:hover { opacity: 0.6; }
        .vto-cols {
          display: flex;
          gap: 20px;
          flex-direction: column;
          margin-bottom: 20px;
        }
        @media (min-width: 480px) {
          .vto-cols { flex-direction: row; }
        }
        .vto-col { flex: 1; }
        .vto-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #888;
          margin-bottom: 8px;
          display: block;
        }
        .vto-img-wrap {
          aspect-ratio: 3/4;
          background: #f5f5f5;
          border-radius: 4px;
          overflow: hidden;
        }
        .vto-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vto-upload {
          aspect-ratio: 3/4;
          background: #f5f5f5;
          border: 1.5px dashed #ccc;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .vto-upload:hover { border-color: #111; }
        .vto-upload-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #555;
          padding: 16px;
          text-align: center;
          gap: 10px;
        }
        .vto-upload-inner span {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .vto-cta {
          width: 100%;
          padding: 15px 20px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: none;
          color: #fff;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .vto-cta:not(:disabled) { background: #111; }
        .vto-cta:not(:disabled):hover { opacity: 0.85; }
        .vto-cta:disabled { background: #ddd; color: #999; cursor: not-allowed; }
        .vto-hint {
          font-size: 0.72rem;
          color: #999;
          text-align: center;
          margin: 10px 0 0 0;
        }
        .vto-error {
          padding: 10px 14px;
          background: #fff0f0;
          color: #c00;
          border-radius: 4px;
          font-size: 0.82rem;
          margin-bottom: 16px;
        }
        @keyframes vto-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .vto-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #eee;
          border-top-color: #111;
          border-radius: 50%;
          animation: vto-spin 0.8s linear infinite;
        }
      `}</style>

      <div className="vto-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="vto-box">
          {/* Header */}
          <div className="vto-head">
            <h2 className="vto-title">Virtual Try-On</h2>
            <button className="vto-x" onClick={onClose} aria-label="Close">&#x2715;</button>
          </div>

          {/* Error */}
          {error && <div className="vto-error">{error}</div>}

          {/* Loading */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '16px' }}>
              <div className="vto-spinner" />
              <p style={{ margin: 0, color: '#666', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'opacity 0.4s' }}>
                {loadingMsg}
              </p>
              <p style={{ margin: 0, color: '#bbb', fontSize: '0.72rem' }}>This may take up to a minute</p>
            </div>
          ) : generatedImage ? (
            /* Result State */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <img
                src={generatedImage}
                alt="Virtual Try-On Result"
                style={{ width: '100%', borderRadius: '4px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleTryAgain}
                  style={{
                    flex: 1, padding: '13px', background: '#fff', color: '#111', border: '1px solid #111',
                    cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em'
                  }}
                >
                  Try Another
                </button>
                <a
                  href={generatedImage}
                  download="virtual-try-on.jpg"
                  style={{
                    flex: 1, padding: '13px', background: '#111', color: '#fff', border: 'none',
                    textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em',
                    textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  Save Photo
                </a>
              </div>
            </div>
          ) : (
            /* Default / Upload State */
            <>
              <div className="vto-cols">
                {/* Garment */}
                <div className="vto-col">
                  <span className="vto-label">Garment</span>
                  <div className="vto-img-wrap">
                    <img src={productImage} alt="Product" />
                  </div>
                </div>

                {/* Upload */}
                <div className="vto-col">
                  <span className="vto-label">Your Photo</span>
                  <div className="vto-upload" onClick={() => fileInputRef.current?.click()}>
                    {userImage ? (
                      <img src={userImage} alt="Your photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div className="vto-upload-inner">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>Upload Photo</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <button className="vto-cta" onClick={handleTryOn} disabled={!userImage}>
                See the Look
              </button>
              <p className="vto-hint">For best results, upload a full-body photo facing the camera.</p>
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
