import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Link from 'next/link';
import { ArrowLeft, Download, MessageSquare, MapPin, Truck, CheckCircle, Package } from 'lucide-react';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  await dbConnect();
  
  let order;
  try {
    order = await Order.findOne({ _id: id, user: user.userId }).lean();
  } catch (error) {
    console.error("Invalid order ID:", error);
  }

  if (!order) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Order Not Found</h1>
        <p style={{ color: '#666', marginTop: '1rem' }}>We could not locate this order in your account.</p>
        <Link href="/account/orders" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', backgroundColor: '#000', color: '#fff', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const getStatusIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const statusIndex = getStatusIndex(order.orderStatus);

  const steps = [
    { label: 'Order Placed', desc: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), icon: Package },
    { label: 'Processing', desc: 'We are preparing your items', icon: CheckCircle },
    { label: 'Shipped', desc: 'Your order is on the way', icon: Truck },
    { label: 'Delivered', desc: 'Package has arrived', icon: MapPin },
  ];

  return (
    <>
      <style>{`
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background-color: #fff;
          border: 1px solid #eaeaea;
          color: #000;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-decoration: none;
          transition: all 0.3s ease;
          font-weight: 500;
          width: 100%;
          justify-content: center;
        }
        .action-btn:hover {
          background-color: #fafafa;
          border-color: #000;
        }
      `}</style>
      
      <div style={{ marginBottom: '3rem' }}>
        <Link href="/account/orders" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: '#888', 
          textDecoration: 'none', 
          fontSize: '0.8rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          marginBottom: '2rem'
        }}>
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 300, 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase', 
              color: '#000',
              marginBottom: '0.5rem'
            }}>
              Order #{order._id.toString().substring(order._id.toString().length - 8).toUpperCase()}
            </h1>
            <p style={{ color: '#666', letterSpacing: '0.05em', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: order.orderStatus.toLowerCase() === 'cancelled' ? '#fafafa' : '#000', 
            color: order.orderStatus.toLowerCase() === 'cancelled' ? '#999' : '#fff', 
            fontSize: '0.75rem', 
            fontWeight: 500, 
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            border: order.orderStatus.toLowerCase() === 'cancelled' ? '1px solid #eee' : 'none'
          }}>
            {order.orderStatus}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem', alignItems: 'start' }} className="mobile-flex-col">
        
        {/* Left Column: Items & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Order Items */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '2.5rem' }} className="mobile-p-4">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '2rem' }}>
              Order Details
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {order.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ width: '100px', height: '140px', backgroundColor: '#fafafa', flexShrink: 0 }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 400, margin: '0 0 0.5rem 0', color: '#000', lineHeight: 1.4 }}>{item.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.size && `Size: ${item.size} • `}Qty: {item.quantity}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#000', margin: 'auto 0 0 0' }}>
                      ₹{item.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Subtotal</span>
                <span style={{ color: '#000', fontSize: '0.9rem' }}>₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Shipping</span>
                <span style={{ color: '#000', fontSize: '0.9rem' }}>Complimentary</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                <span style={{ color: '#000', fontSize: '1.1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                <span style={{ color: '#000', fontSize: '1.25rem', fontWeight: 400 }}>₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '2.5rem' }} className="mobile-p-4">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '2rem' }}>
              Shipping Details
            </h2>
            <div style={{ color: '#444', lineHeight: 1.8, fontSize: '0.95rem' }}>
              <p style={{ fontWeight: 500, color: '#000', marginBottom: '0.5rem', fontSize: '1rem' }}>{order.shippingDetails?.firstName} {order.shippingDetails?.lastName}</p>
              <p>{order.shippingDetails?.address}</p>
              <p>{order.shippingDetails?.city}, {order.shippingDetails?.state} {order.shippingDetails?.zipCode}</p>
              <p>{order.shippingDetails?.country}</p>
              <p style={{ marginTop: '1rem', color: '#888' }}>Phone: {order.shippingDetails?.phone}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Tracking Timeline */}
          {order.orderStatus.toLowerCase() !== 'cancelled' && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '2.5rem' }} className="mobile-p-4">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
                Order Status
              </h2>
              
              <div style={{ position: 'relative' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '20px', width: '2px', backgroundColor: '#f0f0f0' }}></div>
                
                {steps.map((step, idx) => {
                  const isCompleted = statusIndex >= idx;
                  const isCurrent = statusIndex === idx;
                  const Icon = step.icon;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '1.5rem', marginBottom: idx === steps.length - 1 ? 0 : '2.5rem', position: 'relative', opacity: isCompleted ? 1 : 0.4 }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: isCompleted ? '#000' : '#fff', 
                        border: isCompleted ? '2px solid #000' : '2px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                      }}>
                        {isCompleted && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D4AF37' }}></div>}
                      </div>
                      <div style={{ paddingTop: '2px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 600 : 400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.4rem 0', color: '#000' }}>
                          {step.label}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="action-btn">
              <Download size={16} /> Download Invoice
            </button>
            <button className="action-btn">
              <MessageSquare size={16} /> Contact Concierge
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
}
