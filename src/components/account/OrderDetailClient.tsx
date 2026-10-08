'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ArrowLeft, MessageSquare, MapPin, Truck, CheckCircle, Package, Clock } from 'lucide-react';

interface OrderItem {
  name: string;
  image?: string;
  size?: string;
  quantity: number;
  price: number;
}

interface OrderDetailProps {
  order: {
    _id: string;
    createdAt: string;
    total: number;
    orderStatus: string;
    shippingDetails?: {
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      phone?: string;
    };
    displayCurrency?: string;
    displayTotal?: number;
    items: OrderItem[];
  };
}

export default function OrderDetailClient({ order }: OrderDetailProps) {
  const { formatPrice } = useCurrency();

  const getStatusIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return -1;
      case 'confirmed': return 0;
      case 'production': return 1;
      case 'qc': return 2;
      case 'dispatched': return 3;
      case 'in_transit': return 4;
      case 'delivered': return 5;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const statusIdx = getStatusIndex(order.orderStatus);
  const isCancelled = order.orderStatus.toLowerCase() === 'cancelled';
  const isPending = order.orderStatus.toLowerCase() === 'pending';

  const timelineSteps = [
    { label: 'Confirmed', icon: Clock },
    { label: 'Production', icon: Package },
    { label: 'QC', icon: CheckCircle },
    { label: 'Dispatched', icon: Truck },
    { label: 'In Transit', icon: Truck },
    { label: 'Delivered', icon: CheckCircle },
  ];

  return (
    <>
      <style>{`
        .order-detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2.5rem;
          align-items: start;
        }
        @media (max-width: 1023px) {
          .order-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>

      {/* Back Link */}
      <Link href="/account/orders" style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        fontSize: '0.8rem', 
        color: '#666', 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em', 
        marginBottom: '2rem',
        textDecoration: 'none',
        fontWeight: 500
      }}>
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      {/* Header Banner */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '2rem 2.5rem', 
        border: '1px solid #eee', 
        marginBottom: '2.5rem' 
      }} className="mobile-p-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', margin: '0 0 0.35rem 0' }}>
              Order #{order._id.substring(order._id.length - 8).toUpperCase()}
            </h1>
            <p style={{ color: '#666', letterSpacing: '0.05em', fontSize: '0.85rem', textTransform: 'uppercase', margin: 0 }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!isCancelled && !isPending && (
              <a
                href={`/api/orders/${order._id}/invoice`}
                download
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 1rem',
                  backgroundColor: '#fff',
                  color: '#1a1a1a',
                  border: '1px solid #1a1a1a',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>🧾</span> Download Invoice (PDF)
              </a>
            )}
            <div style={{ 
              padding: '0.45rem 1rem', 
              backgroundColor: isCancelled ? '#fafafa' : '#000', 
              color: isCancelled ? '#999' : '#fff', 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              border: isCancelled ? '1px solid #eee' : 'none'
            }}>
              {order.orderStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="order-detail-grid">
        
        {/* Left Column: Items & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Order Items */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '2rem' }} className="mobile-p-4">
            <h2 style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem', color: '#000' }}>
              Order Details
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '80px', height: '110px', backgroundColor: '#fafafa', flexShrink: 0, overflow: 'hidden', border: '1px solid #eee' }}>
                    {item.image && <OptimizedImage src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} variant="thumbnail" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 500, margin: '0 0 0.4rem 0', color: '#000', lineHeight: 1.4 }}>{item.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.size && `Size: ${item.size} • `}Qty: {item.quantity}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#000', fontWeight: 600, margin: 0 }}>
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>Subtotal</span>
                <span style={{ color: '#000', fontSize: '0.85rem', fontWeight: 500 }}>
                  {order.displayCurrency && order.displayTotal
                    ? new Intl.NumberFormat(order.displayCurrency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: order.displayCurrency, maximumFractionDigits: 0 }).format(order.displayTotal)
                    : formatPrice(order.total)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>Shipping</span>
                <span style={{ color: '#000', fontSize: '0.85rem' }}>Complimentary</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                <span style={{ color: '#000', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                <span style={{ color: '#000', fontSize: '1.2rem', fontWeight: 600 }}>
                  {order.displayCurrency && order.displayTotal
                    ? new Intl.NumberFormat(order.displayCurrency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: order.displayCurrency, maximumFractionDigits: 0 }).format(order.displayTotal)
                    : formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '2rem' }} className="mobile-p-4">
            <h2 style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem', color: '#000' }}>
              Shipping Details
            </h2>
            <div style={{ color: '#444', lineHeight: 1.8, fontSize: '0.85rem' }}>
              <p style={{ fontWeight: 600, color: '#000', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                {order.shippingDetails?.firstName} {order.shippingDetails?.lastName}
              </p>
              <p style={{ margin: 0 }}>{order.shippingDetails?.address}</p>
              <p style={{ margin: 0 }}>{order.shippingDetails?.city}, {order.shippingDetails?.state} {order.shippingDetails?.zipCode}</p>
              <p style={{ margin: 0 }}>{order.shippingDetails?.country}</p>
              <p style={{ marginTop: '0.75rem', color: '#888' }}>Phone: {order.shippingDetails?.phone}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Status Tracker */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '2rem' }} className="mobile-p-4">
            <h2 style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem', color: '#000' }}>
              Order Tracker
            </h2>

            {isCancelled ? (
              <div style={{ backgroundColor: '#fafafa', padding: '1.5rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                This order has been cancelled.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '0.5rem' }}>
                {timelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = idx <= statusIdx;
                  const isCurrent = idx === statusIdx;

                  return (
                    <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: isDone ? (isCurrent ? '#D4AF37' : '#000') : '#fafafa',
                        border: isDone ? 'none' : '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDone ? '#fff' : '#ccc',
                        flexShrink: 0,
                        zIndex: 2
                      }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.85rem', 
                          fontWeight: isDone ? 600 : 400, 
                          color: isDone ? '#000' : '#888',
                          letterSpacing: '0.05em'
                        }}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            In Progress
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Need Assistance */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '2rem' }} className="mobile-p-4">
            <h2 style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem', color: '#000' }}>
              Need Assistance?
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Our Maison Concierge is available 24/7 to assist with your order.
            </p>
            <a href="mailto:info@bespokewala.com" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#000',
              color: '#fff',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              fontWeight: 500,
              minHeight: '44px'
            }}>
              <MessageSquare size={16} /> Contact Concierge
            </a>
          </div>

        </div>

      </div>
    </>
  );
}
