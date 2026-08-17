import React, { useState } from 'react';
import Lightbox from '../Lightbox'; // Existing Lightbox

interface ReviewListProps {
  reviews: any[];
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export default function ReviewList({ reviews, setRefreshKey }: ReviewListProps) {
  const [lightboxImage, setLightboxImage] = useState<{url: string, alt: string} | null>(null);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });
      if (res.ok) {
        setRefreshKey(prev => prev + 1);
      } else {
        const data = await res.json();
        alert(data.message || 'Error marking review as helpful');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <span style={{ color: '#D4AF37', fontSize: '1.2rem', letterSpacing: '0.1em' }}>
        {'★'.repeat(rating) + '☆'.repeat(5 - rating)}
      </span>
    );
  };

  const cardStyle: React.CSSProperties = {
    padding: '3rem 0',
    borderBottom: '1px solid #eaeaea',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  };

  return (
    <div>
      {reviews.map(review => (
        <div key={review._id} style={cardStyle}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>{renderStars(review.rating)}</div>
              {review.title && <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>{review.title}</h4>}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Comment */}
          <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>
            {review.comment}
          </div>

          {/* User Info & Verified */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 500, color: '#222' }}>{review.userName}</span>
            {review.verifiedPurchase && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#4caf50' }}>
                ✓ Verified Purchase
              </span>
            )}
          </div>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {review.images.map((img: string, idx: number) => (
                <div 
                  key={idx} 
                  style={{ width: '80px', height: '80px', cursor: 'pointer', overflow: 'hidden', border: '1px solid #eaeaea' }}
                  onClick={() => setLightboxImage({ url: img, alt: 'Review Image' })}
                >
                  <img src={img} alt="Review" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Helpful */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Was this helpful?</span>
            <button 
              onClick={() => handleHelpful(review._id)}
              style={{
                background: 'transparent',
                border: '1px solid #ddd',
                padding: '0.4rem 1rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: '#444',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              👍 {review.helpfulCount || 0}
            </button>
          </div>

        </div>
      ))}

      {lightboxImage && (
        <Lightbox 
          isOpen={true} 
          onClose={() => setLightboxImage(null)} 
          images={[lightboxImage]} 
          initialIndex={0}
        />
      )}
    </div>
  );
}
