import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './reviews.module.css';

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<{rating?: string; comment?: string}>({});
  const [touched, setTouched] = useState<{comment?: boolean}>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images.');
      return;
    }

    setIsUploading(true);
    setError('');
    
    try {
      const newImageUrls: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Please upload valid image files.');
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        if (data.success) {
          // the api returns videoUrl, but it's just the media url
          newImageUrls.push(data.videoUrl || data.url); 
        }
      }
      setImages(prev => [...prev, ...newImageUrls]);
    } catch (err: any) {
      setError('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setFormErrors({});
    
    let hasError = false;
    const newErrors: {rating?: string; comment?: string} = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating.';
      hasError = true;
    }
    if (comment.length < 10) {
      newErrors.comment = 'Review must be at least 10 characters long.';
      hasError = true;
    }

    if (hasError) {
      setFormErrors(newErrors);
      setTouched({ comment: true });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, comment, images })
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else if (res.status === 401 || (data.message && data.message.toLowerCase().includes('log in'))) {
        router.push('/login');
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err: any) {
      setError('Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formStyle: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto 4rem auto',
    padding: '3rem',
    border: '1px solid #eaeaea',
    backgroundColor: '#fafafa',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '1rem',
    border: '1px solid #ccc',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div className={styles.formContainer}>
      <h3 className={styles.formTitle}>WRITE A REVIEW</h3>
      
      {error && (
        <div className={styles.errorText} style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', boxSizing: 'border-box' }}>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Your Rating *</label>
          <div className={styles.starGroup}>
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={`${styles.star} ${(hoverRating || rating) >= star ? styles.starFilled : ''}`}
              >
                ★
              </span>
            ))}
          </div>
          {formErrors.rating && <div className={styles.errorText}>{formErrors.rating}</div>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Review Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum up your experience"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Your Review *</label>
          <textarea 
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (touched.comment && e.target.value.length >= 10) {
                setFormErrors(prev => ({...prev, comment: undefined}));
              }
            }}
            onBlur={() => setTouched(prev => ({...prev, comment: true}))}
            placeholder="Tell us what you liked or disliked"
            className={styles.textarea}
            maxLength={1000}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.errorText}>
              {(touched.comment && comment.length < 10 && comment.length > 0) ? 'Review must be at least 10 characters long.' : formErrors.comment}
            </div>
            <div className={styles.charCount}>
              {comment.length} / 1000
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Add Photos</label>
          <div className={styles.photoGrid}>
            {images.map((img, idx) => (
              <div key={idx} className={styles.photoPreview}>
                <img src={img} alt="Upload" className={styles.photoImg} />
                <button 
                  type="button" 
                  onClick={() => removeImage(idx)}
                  className={styles.removeBtn}
                >
                  ✕
                </button>
              </div>
            ))}
            
            {images.length < 5 && (
              <div className={styles.addPhotoBtn}>
                <span>+</span>
                <small>Add Photos</small>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                  disabled={isUploading}
                />
              </div>
            )}
          </div>
          {isUploading && <div className={styles.charCount} style={{ textAlign: 'left' }}>Uploading...</div>}
        </div>

        <div className={styles.formActions}>
          <button 
            type="submit" 
            disabled={isSubmitting || isUploading}
            className={styles.btnPrimary}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className={styles.btnSecondary}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
