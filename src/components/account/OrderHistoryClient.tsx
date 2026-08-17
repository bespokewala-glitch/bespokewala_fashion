'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { normalizeImageUrl } from '@/lib/imageUrl';

interface OrderItem {
  name: string;
  image?: string;
  size?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  _id: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  shippingDetails?: {
    firstName?: string;
    lastName?: string;
  };
  items: OrderItem[];
}

export default function OrderHistoryClient({ orders }: { orders: OrderData[] }) {
  const { formatPrice } = useCurrency();

  const statusStyles: Record<string, React.CSSProperties> = {
    pending: { backgroundColor: '#fff', color: '#666', border: '1px solid #ddd' },
    processing: { backgroundColor: '#000', color: '#fff', border: '1px solid #000' },
    shipped: { backgroundColor: '#fff', color: '#000', border: '1px solid #000' },
    delivered: { backgroundColor: '#faf9f6', color: '#1c1c1c', border: '1px solid #d2b48c' },
    cancelled: { backgroundColor: '#fafafa', color: '#999', border: '1px solid #eee' },
  };

  return (
    <>
      <style>{`
        .order-history-card {
          transition: all 0.3s ease;
          border: 1px solid #eaeaea;
          background-color: #fff;
          padding: 2rem;
        }
        .order-history-card:hover {
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          border-color: #dcdcdc;
        }
        .action-btn {
          padding: 0.75rem 1.5rem;
          background-color: #fafafa;
          border: 1px solid #eaeaea;
          color: #000;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          font-weight: 500;
          text-align: center;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn:hover {
          background-color: #000;
          color: #fff;
          border-color: #000;
        }
        .cancel-btn {
          background-color: transparent;
          border: 1px solid #eaeaea;
          color: #666;
        }
        .cancel-btn:hover {
          background-color: #fafafa;
          color: #000;
          border-color: #000;
        }
        .order-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 1.5rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 767px) {
          .order-history-card {
            padding: 1.25rem !important;
          }
          .order-meta-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
          }
          .order-actions-wrap {
            flex-direction: column !important;
            width: 100% !important;
          }
          .order-actions-wrap .action-btn {
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .order-meta-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
          fontWeight: 300, 
          letterSpacing: '0.12em', 
          textTransform: 'uppercase', 
          color: '#000',
          margin: 0,
        }}>
          Order History
        </h1>
      </div>
      
      {/* Tab Filter */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2.5rem',
        borderBottom: '1px solid #eaeaea',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          borderBottom: '2px solid #000',
          paddingBottom: '0.75rem',
          marginBottom: '-0.85rem',
          color: '#000',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600
        }}>
          All Orders ({orders.length})
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '4rem 1.5rem', 
          textAlign: 'center', 
          border: '1px solid #eee' 
        }}>
          <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            You have not placed any orders yet.
          </p>
          <Link href="/products" className="action-btn">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order) => {
            const statusStyle = statusStyles[order.orderStatus.toLowerCase()] || statusStyles.pending;
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const orderIdShort = `#${order._id.substring(order._id.length - 8).toUpperCase()}`;

            return (
              <div key={order._id} className="order-history-card">
                
                {/* Order Meta Header */}
                <div className="order-meta-grid">
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>Order Placed</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#000' }}>{formattedDate}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>Total</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000' }}>{formatPrice(order.total)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>Ship To</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#000', wordBreak: 'break-word' }}>
                      {order.shippingDetails?.firstName ? `${order.shippingDetails.firstName} ${order.shippingDetails.lastName || ''}` : 'Customer'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>Order ID</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000' }}>{orderIdShort}</span>
                  </div>
                </div>
                
                {/* Order Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      borderRadius: '2px',
                      ...statusStyle
                    }}>
                      Status: {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
                        <div style={{ width: '70px', height: '95px', backgroundColor: '#fafafa', flexShrink: 0, overflow: 'hidden', border: '1px solid #eee' }}>
                          {item.image && <img src={normalizeImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 500, margin: '0 0 0.4rem 0', color: '#000', lineHeight: 1.4 }}>{item.name}</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: '#666' }}>
                            {item.size && (
                              <span>Size: <strong style={{ color: '#000' }}>{item.size}</strong></span>
                            )}
                            <span>Qty: <strong style={{ color: '#000' }}>{item.quantity}</strong></span>
                            <span>Price: <strong style={{ color: '#000' }}>{formatPrice(item.price)}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="order-actions-wrap" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <Link href={`/account/orders/${order._id}`} className="action-btn">
                      View Details
                    </Link>
                    <a href="mailto:bespokewala@gmail.com" className="action-btn cancel-btn">
                      Contact Concierge
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
