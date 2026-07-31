
import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  await dbConnect();
  
  const orders = await Order.find({ user: user.userId })
    .sort({ createdAt: -1 })
    .lean();

  const statusStyles: Record<string, React.CSSProperties> = {
    pending: { backgroundColor: '#fff', color: '#666', border: '1px solid #ddd' },
    processing: { backgroundColor: '#000', color: '#fff', border: '1px solid #000' },
    shipped: { backgroundColor: '#fff', color: '#000', border: '1px solid #000' },
    delivered: { backgroundColor: '#f9f9f9', color: '#000', border: '1px solid #eee' },
    cancelled: { backgroundColor: '#fafafa', color: '#999', border: '1px solid #eee' },
  };

  return (
    <>
      <style>{`
        .order-history-card {
          transition: all 0.3s ease;
        }
        .order-history-card:hover {
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border-color: #dcdcdc;
        }
        .action-button {
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
        }
        .action-button:hover {
          background-color: #000;
          color: #fff;
          border-color: #000;
        }
        .cancel-button {
          background-color: transparent;
          border: 1px solid #eaeaea;
          color: #888;
        }
        .cancel-button:hover {
          background-color: #fafafa;
          color: #000;
          border-color: #000;
        }
      `}</style>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'baseline',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 300, 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase', 
          color: '#000',
        }}>
          Order History
        </h1>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '3rem',
        borderBottom: '1px solid #eaeaea',
        paddingBottom: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          borderBottom: '2px solid #000',
          paddingBottom: '0.5rem',
          color: '#000',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 500
        }}>
          All Orders ({orders.length})
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ 
          backgroundColor: '#fafafa', 
          padding: '5rem 2rem', 
          textAlign: 'center', 
          border: '1px solid #eee' 
        }}>
          <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', marginBottom: '2rem' }}>
            You have not placed any orders yet.
          </p>
          <Link href="/products" className="action-button">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {orders.map((order: any) => {
            const statusStyle = statusStyles[order.orderStatus] || statusStyles.pending;
            return (
              <div key={order._id.toString()} style={{ 
                border: '1px solid #eee', 
                backgroundColor: '#fff',
                padding: '2rem'
              }} className="order-history-card">
                
                {/* Order Header */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  justifyContent: 'space-between', 
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '1.5rem', 
                  marginBottom: '1.5rem',
                  gap: '1.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Order Placed</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#000' }}>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Total</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#000' }}>₹{order.total?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Ship To</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#000' }}>
                        {order.shippingDetails?.firstName} {order.shippingDetails?.lastName}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem', textAlign: 'right' }}>Order ID</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#000' }}>#{order._id.toString().substring(order._id.toString().length - 8).toUpperCase()}</span>
                  </div>
                </div>
                
                {/* Order Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 400, color: '#000', margin: 0, letterSpacing: '0.05em' }}>
                      Status: <span style={{ fontWeight: 600 }}>{order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}</span>
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '1.5rem', width: '340px' }}>
                        <div style={{ width: '80px', height: '110px', backgroundColor: '#fafafa', flexShrink: 0 }}>
                          {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ paddingTop: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 500, margin: '0 0 0.5rem 0', color: '#000', lineHeight: 1.4 }}>{item.name}</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {item.size && (
                              <p style={{ fontSize: '0.75rem', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Size: <span style={{ color: '#000' }}>{item.size}</span>
                              </p>
                            )}
                            <p style={{ fontSize: '0.75rem', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Qty: <span style={{ color: '#000' }}>{item.quantity}</span>
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Price: <span style={{ color: '#000' }}>₹{item.price?.toLocaleString('en-IN')}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginTop: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <Link href={`/account/orders/${order._id}`} className="action-button">
                      View Details
                    </Link>
                    <button className="action-button cancel-button">
                      Contact Concierge
                    </button>
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
