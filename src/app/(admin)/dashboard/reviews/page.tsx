'use client';

import React, { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (statusFilter) query.append('status', statusFilter);
      
      const res = await fetch(`/api/admin/reviews?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Review Management</h1>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => { setStatusFilter(''); setPage(1); }} 
          style={{ padding: '0.5rem 1rem', background: statusFilter === '' ? '#222' : '#eee', color: statusFilter === '' ? '#fff' : '#222', border: 'none', cursor: 'pointer' }}
        >
          All
        </button>
        <button 
          onClick={() => { setStatusFilter('pending'); setPage(1); }} 
          style={{ padding: '0.5rem 1rem', background: statusFilter === 'pending' ? '#222' : '#eee', color: statusFilter === 'pending' ? '#fff' : '#222', border: 'none', cursor: 'pointer' }}
        >
          Pending
        </button>
        <button 
          onClick={() => { setStatusFilter('approved'); setPage(1); }} 
          style={{ padding: '0.5rem 1rem', background: statusFilter === 'approved' ? '#222' : '#eee', color: statusFilter === 'approved' ? '#fff' : '#222', border: 'none', cursor: 'pointer' }}
        >
          Approved
        </button>
        <button 
          onClick={() => { setStatusFilter('rejected'); setPage(1); }} 
          style={{ padding: '0.5rem 1rem', background: statusFilter === 'rejected' ? '#222' : '#eee', color: statusFilter === 'rejected' ? '#fff' : '#222', border: 'none', cursor: 'pointer' }}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <div>Loading reviews...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>User</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review._id}>
                  <td>{review.productId?.name}</td>
                  <td>
                    <div>{review.userId?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{review.userId?.email}</div>
                    {review.verifiedPurchase && <div style={{ fontSize: '0.8rem', color: 'green' }}>Verified</div>}
                  </td>
                  <td style={{ color: '#D4AF37' }}>{renderStars(review.rating)}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 'bold' }}>{review.title}</div>
                    <div style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {review.comment}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: review.status === 'approved' ? '#e8f5e9' : review.status === 'rejected' ? '#ffebee' : '#fff3e0',
                      color: review.status === 'approved' ? '#2e7d32' : review.status === 'rejected' ? '#c62828' : '#ef6c00'
                    }}>
                      {review.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {review.status !== 'approved' && (
                        <button onClick={() => handleUpdateStatus(review._id, 'approved')} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>Approve</button>
                      )}
                      {review.status !== 'rejected' && (
                        <button onClick={() => handleUpdateStatus(review._id, 'rejected')} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>Reject</button>
                      )}
                      <button onClick={() => handleDelete(review._id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
