import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { normalizeImageUrl } from '@/lib/imageUrl';
import OptimizedImage from '@/components/ui/OptimizedImage';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Link from 'next/link';
import { Package, Heart, MapPin, CalendarDays, ArrowRight, Truck, CheckCircle, Clock } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import WishlistStatCard from '@/components/account/WishlistStatCard';

export default async function AccountDashboardPage() {
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

  // Fetch only the 2 most recent orders for the dashboard preview
  const recentOrders = await Order.find({ user: user.userId })
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

  const totalOrders = await Order.countDocuments({ user: user.userId });

  const userRecord = await User.findById(user.userId).lean();
  const addressCount = userRecord?.addresses?.length || 0;
  const memberSinceDate = userRecord?.createdAt 
    ? new Date(userRecord.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Fetch some random products for "Curated For You" and "Recently Viewed"
  // In a real app, this would be based on user history.
  const recommendedProducts = await Product.aggregate([{ $sample: { size: 4 } }]);
  const recentlyViewedProducts = await Product.aggregate([{ $sample: { size: 4 } }]);

  // Serialize product IDs for Client Components
  const serializedRecommended = recommendedProducts.map(p => ({ ...p, _id: p._id.toString() }));
  const serializedRecentlyViewed = recentlyViewedProducts.map(p => ({ ...p, _id: p._id.toString() }));

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid #eaeaea',
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'relative',
    overflow: 'hidden'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 300,
    color: '#000',
    lineHeight: 1
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#888',
    fontWeight: 500
  };

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

  const timelineSteps = [
    { label: 'Placed', icon: Clock },
    { label: 'Processing', icon: Package },
    { label: 'Shipped', icon: Truck },
    { label: 'Delivered', icon: CheckCircle },
  ];

  return (
    <>
      <style>{`
        .luxury-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .luxury-card:hover {
          box-shadow: 0 15px 40px rgba(0,0,0,0.04);
          transform: translateY(-4px);
          border-color: #dcdcdc;
        }
        .view-all-link {
          transition: color 0.3s ease, padding-left 0.3s ease;
        }
        .view-all-link:hover {
          color: #000;
          padding-left: 5px;
        }
        .details-link {
          transition: all 0.3s ease;
        }
        .details-link:hover {
          background-color: #000 !important;
          color: #fff !important;
          border-color: #000 !important;
        }
      `}</style>

      {/* Premium Profile Banner */}
      <div style={{
        backgroundColor: '#fff',
        padding: '2.5rem',
        border: '1px solid #eaeaea',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }} className="luxury-card account-profile-banner">
        <div>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: 300,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#000',
            marginBottom: '0.35rem'
          }} className="account-profile-title">
            Welcome, {user.name}
          </h1>
          <p style={{ color: '#888', letterSpacing: '0.08em', fontSize: '0.85rem', textTransform: 'uppercase', margin: 0 }}>
            Welcome to your Account Dashboard
          </p>
        </div>
        <div style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#FAF9F6',
          border: '1px solid #D4AF37',
          color: '#D4AF37',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '0.75rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#D4AF37', borderRadius: '50%' }}></span>
          Maison Member
        </div>
      </div>

      {/* Exclusive Member Benefits Banner */}
      <div style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '1.75rem 2.5rem',
        marginBottom: '3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }} className="account-benefits-banner">
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ color: '#D4AF37', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>Complimentary</h4>
            <p style={{ fontSize: '0.85rem', fontWeight: 300, letterSpacing: '0.05em', margin: 0 }}>Express Global Shipping</p>
          </div>
          <div>
            <h4 style={{ color: '#D4AF37', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>Priority Access</h4>
            <p style={{ fontSize: '0.85rem', fontWeight: 300, letterSpacing: '0.05em', margin: 0 }}>24/7 Private Concierge</p>
          </div>
          <div>
            <h4 style={{ color: '#D4AF37', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>Early Access</h4>
            <p style={{ fontSize: '0.85rem', fontWeight: 300, letterSpacing: '0.05em', margin: 0 }}>Next Season Couture</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.5rem',
        marginBottom: '4rem'
      }} className="account-stats-grid">
        <div style={statCardStyle} className="luxury-card account-stat-card">
          <Package size={22} color="#D4AF37" strokeWidth={1.5} />
          <div style={statValueStyle}>{totalOrders}</div>
          <div style={statLabelStyle}>Total Orders</div>
        </div>
        <WishlistStatCard />
        <div style={statCardStyle} className="luxury-card account-stat-card">
          <MapPin size={22} color="#D4AF37" strokeWidth={1.5} />
          <div style={statValueStyle}>{addressCount}</div>
          <div style={statLabelStyle}>Saved Addresses</div>
        </div>
        <div style={statCardStyle} className="luxury-card account-stat-card">
          <CalendarDays size={22} color="#D4AF37" strokeWidth={1.5} />
          <div style={{ ...statValueStyle, fontSize: '1.1rem', marginTop: 'auto', paddingBottom: '4px' }}>
            {memberSinceDate}
          </div>
          <div style={statLabelStyle}>Member Since</div>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div style={{ marginBottom: '6rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid #eaeaea',
          paddingBottom: '1rem',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#000'
          }}>
            Recent Orders
          </h2>
          <Link href="/account/orders" style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#888',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 500
          }} className="view-all-link">
            View All Orders <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{
            backgroundColor: '#fff',
            padding: '5rem 2rem',
            textAlign: 'center',
            border: '1px solid #eee'
          }}>
            <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>
              You haven't placed any orders yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {recentOrders.map((order: any) => {
              const statusIdx = getStatusIndex(order.orderStatus);
              const isCancelled = order.orderStatus.toLowerCase() === 'cancelled';

              return (
                <div key={order._id.toString()} style={{
                  border: '1px solid #eee',
                  padding: '2.5rem',
                  backgroundColor: '#fff'
                }} className="luxury-card mobile-p-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '2rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '2rem' }}>
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
                        <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Order ID</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#000' }}>#{order._id.toString().substring(order._id.toString().length - 8).toUpperCase()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Link href={`/account/orders/${order._id}`} className="details-link" style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#FAF9F6',
                        border: '1px solid #eaeaea',
                        color: '#000',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        textDecoration: 'none',
                        fontWeight: 500
                      }}>
                        View Order
                      </Link>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="mobile-grid-1">
                    {/* Items Preview */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                      {order.items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ width: '70px', height: '95px', backgroundColor: '#fafafa', flexShrink: 0 }}>
                            {item.image && (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <OptimizedImage
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 400, margin: '0 0 0.25rem 0', color: '#000', lineHeight: 1.4, maxWidth: '120px' }}>{item.name}</h4>
                            <p style={{ fontSize: '0.75rem', color: '#888', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '95px', backgroundColor: '#FAF9F6', border: '1px solid #eee' }}>
                          <span style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '0.1em' }}>+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>

                    {/* Couture Timeline */}
                    {!isCancelled ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 1rem' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', top: '12px', left: '1rem', right: '1rem', height: '1px', backgroundColor: '#eee', zIndex: 0 }}></div>
                        {/* Progress Line */}
                        <div style={{ position: 'absolute', top: '12px', left: '1rem', width: `${(statusIdx / 3) * 100}%`, height: '1px', backgroundColor: '#D4AF37', zIndex: 1, transition: 'width 1s ease' }}></div>

                        {timelineSteps.map((step, idx) => {
                          const isCompleted = statusIdx >= idx;
                          const isCurrent = statusIdx === idx;
                          const StepIcon = step.icon;

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: isCompleted ? '#000' : '#fff',
                                border: isCompleted ? '1px solid #000' : '1px solid #ddd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.5s ease'
                              }}>
                                {isCompleted && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D4AF37' }}></div>}
                              </div>
                              <span style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: isCurrent ? '#000' : '#888',
                                fontWeight: isCurrent ? 500 : 400
                              }}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fafafa', border: '1px solid #eee', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                        Order Cancelled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Curated For You */}
      {serializedRecommended.length > 0 && (
        <div style={{ marginBottom: '6rem' }}>
          <div style={{
            borderBottom: '1px solid #eaeaea',
            paddingBottom: '1rem',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#000'
            }}>
              Curated For You
            </h2>
          </div>
          <div className="product-grid" style={{ marginTop: 0 }}>
            {serializedRecommended.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {serializedRecentlyViewed.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <div style={{
            borderBottom: '1px solid #eaeaea',
            paddingBottom: '1rem',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#000'
            }}>
              Recently Viewed
            </h2>
          </div>
          <div className="product-grid" style={{ marginTop: 0 }}>
            {serializedRecentlyViewed.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
