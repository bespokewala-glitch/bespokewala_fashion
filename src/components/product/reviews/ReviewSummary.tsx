import React from 'react';
import styles from './reviews.module.css';

interface ReviewSummaryProps {
  stats: {
    averageRating: number;
    totalReviews: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  onWriteReview: () => void;
}

export default function ReviewSummary({ stats, onWriteReview }: ReviewSummaryProps) {
  const renderStars = (rating: number) => {
    return (
      <span className={styles.summaryStars}>
        {'★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))}
      </span>
    );
  };

  const getBarWidth = (count: number) => {
    if (stats.totalReviews === 0) return '0%';
    return `${(count / stats.totalReviews) * 100}%`;
  };

  return (
    <div className={styles.summaryContainer}>
      {/* Left side: Average */}
      <div className={styles.summaryLeft}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={styles.summaryAvg}>{stats.averageRating.toFixed(1)}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {renderStars(stats.averageRating)}
          </div>
        </div>
        <div className={styles.summaryText}>
          Based on {stats.totalReviews} reviews
        </div>
        <button 
          onClick={onWriteReview}
          className={styles.btnSecondary}
          style={{ marginTop: '1.5rem' }}
        >
          Write a Review
        </button>
      </div>

      {/* Right side: Distribution */}
      <div className={styles.summaryRight}>
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className={styles.distRow}>
            <span className={styles.distStar}>{star} ★</span>
            <div className={styles.distBarWrapper}>
              <div 
                className={styles.distBar}
                style={{ width: getBarWidth(stats.distribution[star as keyof typeof stats.distribution]) }} 
              />
            </div>
            <span className={styles.distCount}>
              {stats.distribution[star as keyof typeof stats.distribution]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
