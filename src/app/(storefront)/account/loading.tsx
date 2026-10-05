export default function AccountLoading() {
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes account-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .account-shimmer {
          background: linear-gradient(90deg, #f5f0eb 25%, #ede6df 50%, #f5f0eb 75%);
          background-size: 200% 100%;
          animation: account-shimmer 1.5s infinite;
        }
        .account-loading-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 2.5rem;
        }
        @media (max-width: 768px) {
          .account-loading-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>

      {/* Header Banner Skeleton */}
      <div style={{ border: '1px solid #ede8e2', padding: '2rem', borderRadius: '4px', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="account-shimmer" style={{ width: '180px', height: '24px', borderRadius: '2px' }} />
          <div className="account-shimmer" style={{ width: '260px', height: '14px', borderRadius: '2px' }} />
        </div>
        <div className="account-shimmer" style={{ width: '100px', height: '36px', borderRadius: '2px' }} />
      </div>

      <div className="account-loading-grid">
        {/* Navigation Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="account-shimmer" style={{ width: '100%', height: '44px', borderRadius: '3px' }} />
          ))}
        </div>

        {/* Content Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ border: '1px solid #ede8e2', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="account-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div className="account-shimmer" style={{ width: '80px', height: '14px', borderRadius: '2px' }} />
                <div className="account-shimmer" style={{ width: '120px', height: '20px', borderRadius: '2px' }} />
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #ede8e2', padding: '2rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="account-shimmer" style={{ width: '140px', height: '20px', borderRadius: '2px' }} />
            <div className="account-shimmer" style={{ width: '100%', height: '60px', borderRadius: '2px' }} />
            <div className="account-shimmer" style={{ width: '100%', height: '60px', borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
