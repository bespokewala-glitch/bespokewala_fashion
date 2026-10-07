'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Star,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  MessageSquare,
  ExternalLink,
  X,
  User,
  ShoppingBag,
  AlertCircle,
  Calendar,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface ReviewItem {
  _id: string;
  productId?: {
    _id: string;
    name: string;
    slug: string;
    images?: string[];
  };
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verifiedPurchase?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount?: number;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Review for Modal Drawer
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') {
        query.append('status', statusFilter);
      }

      const res = await fetch(`/api/admin/reviews?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || (data.reviews?.length || 0));
      } else {
        showToast(data.message || 'Failed to load reviews', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error loading reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Client-side search filtering on loaded reviews
  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase().trim();
    return reviews.filter((r) => {
      const prodName = r.productId?.name?.toLowerCase() || '';
      const userName = r.userId?.name?.toLowerCase() || '';
      const userEmail = r.userId?.email?.toLowerCase() || '';
      const title = r.title?.toLowerCase() || '';
      const comment = r.comment?.toLowerCase() || '';
      return (
        prodName.includes(q) ||
        userName.includes(q) ||
        userEmail.includes(q) ||
        title.includes(q) ||
        comment.includes(q)
      );
    });
  }, [reviews, searchQuery]);

  // Status Counts for KPI cards
  const stats = useMemo(() => {
    const total = totalCount;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';
    return { total, pending, approved, rejected, avgRating };
  }, [reviews, totalCount]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        );
        if (selectedReview && selectedReview._id === id) {
          setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(`Review marked as ${newStatus}`, 'success');
      } else {
        showToast(data.message || 'Failed to update review status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error updating review', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
        if (selectedReview && selectedReview._id === id) {
          setSelectedReview(null);
        }
        showToast('Review deleted successfully', 'success');
      } else {
        showToast(data.message || 'Failed to delete review', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error deleting review', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={13}
            style={{
              color: star <= rating ? '#f59e0b' : '#cbd5e1',
              fill: star <= rating ? '#f59e0b' : 'transparent',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: toast.type === 'success' ? '#0f172a' : '#dc2626',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 9999,
            fontSize: '0.88rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {toast.type === 'success' ? <Check size={16} style={{ color: '#4ade80' }} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <MessageSquare size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Customer Reviews
              </h1>
              <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Moderate buyer testimonials, approve verified purchase reviews, and curate public product feedback.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            color: '#334155',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Reviews'}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '26px',
        }}
      >
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Reviews
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>All catalog reviews logged</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pending Approval
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: stats.pending > 0 ? '#d97706' : '#0f172a', marginTop: '4px' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Awaiting moderator decision</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Approved & Live
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
            {stats.approved}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Visible on storefront PDPs</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Avg Rating Score <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {stats.avgRating} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 400 }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Customer satisfaction score</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by product, customer name, email, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              fontSize: '0.85rem',
              color: '#1e293b',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Reviews' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key as any);
                setPage(1);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: statusFilter === tab.key ? '#0f172a' : '#f1f5f9',
                color: statusFilter === tab.key ? '#fff' : '#475569',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Reviews Table */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        {loading && reviews.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={26} className="spin" style={{ display: 'inline-block', marginBottom: '12px', color: '#94a3b8' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>Loading customer reviews...</div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', color: '#64748b' }}>
            <MessageSquare size={38} style={{ display: 'inline-block', marginBottom: '14px', color: '#cbd5e1' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>No reviews found</div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '4px 0 0' }}>
              {searchQuery ? 'Try adjusting your search criteria.' : 'Reviews submitted by customers will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review Details</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => {
                  const dateStr = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '';

                  return (
                    <tr
                      key={review._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Product Column */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '44px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: '#94a3b8',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <ShoppingBag size={16} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: '#0f172a',
                                fontSize: '0.86rem',
                                lineHeight: 1.3,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '180px',
                              }}
                              title={review.productId?.name}
                            >
                              {review.productId?.name || 'Unknown Product'}
                            </div>
                            {review.productId?.slug && (
                              <Link
                                href={`/products/${review.productId.slug}`}
                                target="_blank"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.74rem',
                                  color: '#c8a96e',
                                  textDecoration: 'none',
                                  marginTop: '2px',
                                }}
                              >
                                View Live <ExternalLink size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer Column */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', maxWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#f1f5f9',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            <User size={13} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
                              {review.userId?.name || 'Guest Customer'}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              {review.userId?.email || '—'}
                            </div>
                            {review.verifiedPurchase && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.68rem',
                                  color: '#059669',
                                  fontWeight: 600,
                                  marginTop: '2px',
                                }}
                              >
                                <CheckCircle2 size={11} /> Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rating Column */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div>{renderStars(review.rating || 5)}</div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} /> {dateStr}
                        </div>
                      </td>

                      {/* Review Details Column */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', maxWidth: '320px' }}>
                        {review.title && (
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.84rem', marginBottom: '2px' }}>
                            {review.title}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: '#475569',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {review.comment}
                        </div>
                        {review.images && review.images.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}
                            >
                              📷 {review.images.length} photo{review.images.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status Column */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            background:
                              review.status === 'approved'
                                ? '#ecfdf5'
                                : review.status === 'rejected'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              review.status === 'approved'
                                ? '#047857'
                                : review.status === 'rejected'
                                ? '#b91c1c'
                                : '#b45309',
                            border:
                              review.status === 'approved'
                                ? '1px solid #a7f3d0'
                                : review.status === 'rejected'
                                ? '1px solid #fecaca'
                                : '1px solid #fde68a',
                          }}
                        >
                          {review.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Quick Approve */}
                          {review.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(review._id, 'approved')}
                              disabled={actionInProgress === review._id}
                              title="Approve Review"
                              style={{
                                padding: '6px 10px',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#047857',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                          )}

                          {/* Quick Reject */}
                          {review.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(review._id, 'rejected')}
                              disabled={actionInProgress === review._id}
                              title="Reject Review"
                              style={{
                                padding: '6px 10px',
                                background: '#fff7ed',
                                border: '1px solid #fed7aa',
                                color: '#c2410c',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}

                          {/* View Modal */}
                          <button
                            onClick={() => setSelectedReview(review)}
                            title="Inspect Details"
                            style={{
                              padding: '6px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#475569',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(review._id)}
                            disabled={actionInProgress === review._id}
                            title="Delete Permanently"
                            style={{
                              padding: '6px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#b91c1c',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 12px',
                  background: page === 1 ? '#f1f5f9' : '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  color: page === 1 ? '#94a3b8' : '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '6px 12px',
                  background: page === totalPages ? '#f1f5f9' : '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  color: page === totalPages ? '#94a3b8' : '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Inspection Modal */}
      {selectedReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedReview(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} style={{ color: '#d97706' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                  Review Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Product Card */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Product
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {selectedReview.productId?.name || 'Unknown Product'}
                  </div>
                </div>
                {selectedReview.productId?.slug && (
                  <Link
                    href={`/products/${selectedReview.productId.slug}`}
                    target="_blank"
                    style={{
                      fontSize: '0.78rem',
                      color: '#c8a96e',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    View <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {/* Customer Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                    {selectedReview.userId?.name || 'Guest Customer'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {selectedReview.userId?.email || 'No email provided'}
                  </div>
                </div>
                {selectedReview.verifiedPurchase && (
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={12} /> Verified Buyer
                  </span>
                )}
              </div>

              {/* Rating & Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div>{renderStars(selectedReview.rating || 5)}</div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  {selectedReview.rating}.0 / 5.0
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>•</span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Review Content */}
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '18px',
                }}
              >
                {selectedReview.title && (
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                    {selectedReview.title}
                  </h4>
                )}
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedReview.comment}
                </p>
              </div>

              {/* Review Photos if any */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Customer Photos ({selectedReview.images.length})
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedReview.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer">
                        <img
                          src={img}
                          alt="Customer attachment"
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Current Status:</span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background:
                      selectedReview.status === 'approved'
                        ? '#ecfdf5'
                        : selectedReview.status === 'rejected'
                        ? '#fef2f2'
                        : '#fffbeb',
                    color:
                      selectedReview.status === 'approved'
                        ? '#047857'
                        : selectedReview.status === 'rejected'
                        ? '#b91c1c'
                        : '#b45309',
                    border:
                      selectedReview.status === 'approved'
                        ? '1px solid #a7f3d0'
                        : selectedReview.status === 'rejected'
                        ? '1px solid #fecaca'
                        : '1px solid #fde68a',
                  }}
                >
                  {selectedReview.status}
                </span>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <button
                onClick={() => handleDelete(selectedReview._id)}
                style={{
                  padding: '8px 14px',
                  background: '#fff',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={13} /> Delete
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedReview.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReview._id, 'rejected')}
                    style={{
                      padding: '8px 14px',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#c2410c',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                )}
                {selectedReview.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReview._id, 'approved')}
                    style={{
                      padding: '8px 16px',
                      background: '#047857',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={14} /> Approve & Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
