'use client';

import React, { useState, useEffect } from 'react';
import ReviewSummary from './ReviewSummary';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import styles from './reviews.module.css';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('recent');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId, page, sort, refreshKey]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews?page=${page}&limit=5&sort=${sort}`);
      const data = await res.json();
      if (res.ok) {
        if (page === 1) {
          setReviews(data.reviews);
        } else {
          setReviews(prev => [...prev, ...data.reviews]);
        }
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    // Optionally refresh or show success message
    alert('Thank you! Your review has been submitted and is pending approval.');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>CUSTOMER REVIEWS</h2>
      
      {stats.totalReviews > 0 ? (
        <ReviewSummary 
          stats={stats} 
          onWriteReview={() => setShowForm(!showForm)} 
        />
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyStars}>☆ ☆ ☆ ☆ ☆</div>
          <p>Be the first to share your experience with this piece.</p>
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className={styles.emptyStateBtn}
            >
              WRITE THE FIRST REVIEW
            </button>
          )}
        </div>
      )}

      {showForm && (
        <ReviewForm 
          productId={productId} 
          onSuccess={handleReviewSubmitted} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      {stats.totalReviews > 0 && (
        <div>
          <div className={styles.sortContainer}>
            <select 
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className={styles.sortSelect}
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

          <div className={styles.reviewsWrapper}>
            <ReviewList reviews={reviews} setRefreshKey={setRefreshKey} />
          </div>
          
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
              <button 
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
                className={styles.btnSecondary}
              >
                {loading ? 'LOADING...' : 'LOAD MORE'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

