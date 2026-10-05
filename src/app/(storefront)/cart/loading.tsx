export default function CartLoading() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '4rem 2rem 8rem', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes cart-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .cart-shimmer {
          background: linear-gradient(90deg, #f5f0eb 25%, #ede6df 50%, #f5f0eb 75%);
          background-size: 200% 100%;
          animation: cart-shimmer 1.5s infinite;
        }
        .cart-grid-loading {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 4rem;
        }
        @media (max-width: 868px) {
          .cart-grid-loading {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }
      `}</style>

      {/* Cart Title Skeleton */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div className="cart-shimmer" style={{ width: '120px', height: '28px', margin: '0 auto', borderRadius: '2px' }} />
      </div>

      <div className="cart-grid-loading">
        {/* Left: Cart Items Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '1.5rem',
                borderBottom: '1px solid #f0ebe5',
                paddingBottom: '2rem',
                alignItems: 'center',
              }}
            >
              <div className="cart-shimmer" style={{ width: '100px', height: '135px', borderRadius: '3px', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="cart-shimmer" style={{ width: '60%', height: '18px', borderRadius: '2px' }} />
                <div className="cart-shimmer" style={{ width: '25%', height: '16px', borderRadius: '2px' }} />
                <div className="cart-shimmer" style={{ width: '80px', height: '32px', borderRadius: '2px', marginTop: '6px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary Skeleton */}
        <div
          style={{
            border: '1px solid #ede8e2',
            padding: '2rem',
            borderRadius: '4px',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div className="cart-shimmer" style={{ width: '140px', height: '20px', borderRadius: '2px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="cart-shimmer" style={{ width: '80px', height: '14px', borderRadius: '2px' }} />
            <div className="cart-shimmer" style={{ width: '60px', height: '14px', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="cart-shimmer" style={{ width: '70px', height: '14px', borderRadius: '2px' }} />
            <div className="cart-shimmer" style={{ width: '50px', height: '14px', borderRadius: '2px' }} />
          </div>
          <div style={{ borderTop: '1px solid #ede8e2', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <div className="cart-shimmer" style={{ width: '90px', height: '18px', borderRadius: '2px' }} />
            <div className="cart-shimmer" style={{ width: '80px', height: '18px', borderRadius: '2px' }} />
          </div>
          <div className="cart-shimmer" style={{ width: '100%', height: '50px', borderRadius: '2px', marginTop: '1rem' }} />
        </div>
      </div>
    </div>
  );
}
