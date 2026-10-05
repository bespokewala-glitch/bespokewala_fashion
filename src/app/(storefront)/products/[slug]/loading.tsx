export default function ProductDetailLoading() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '4rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes pdp-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .pdp-shimmer {
          background: linear-gradient(90deg, #f3ede6 25%, #eae3dc 50%, #f3ede6 75%);
          background-size: 200% 100%;
          animation: pdp-shimmer 1.5s infinite;
        }
        .pdp-loading-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
        }
        @media (max-width: 868px) {
          .pdp-loading-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>

      {/* Breadcrumb Skeleton */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2.5rem' }}>
        <div className="pdp-shimmer" style={{ width: '60px', height: '14px', borderRadius: '2px' }} />
        <div className="pdp-shimmer" style={{ width: '80px', height: '14px', borderRadius: '2px' }} />
        <div className="pdp-shimmer" style={{ width: '120px', height: '14px', borderRadius: '2px' }} />
      </div>

      <div className="pdp-loading-grid">
        {/* Left: Gallery Skeleton */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '70px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="pdp-shimmer" style={{ width: '70px', height: '90px', borderRadius: '2px' }} />
            ))}
          </div>
          <div className="pdp-shimmer" style={{ flex: 1, aspectRatio: '3/4', borderRadius: '4px', minHeight: '480px' }} />
        </div>

        {/* Right: Product Details Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="pdp-shimmer" style={{ width: '140px', height: '14px', borderRadius: '2px' }} />
          <div className="pdp-shimmer" style={{ width: '85%', height: '32px', borderRadius: '2px' }} />
          <div className="pdp-shimmer" style={{ width: '120px', height: '24px', borderRadius: '2px' }} />

          <div style={{ borderTop: '1px solid #ede8e2', borderBottom: '1px solid #ede8e2', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="pdp-shimmer" style={{ width: '100%', height: '16px', borderRadius: '2px' }} />
            <div className="pdp-shimmer" style={{ width: '90%', height: '16px', borderRadius: '2px' }} />
            <div className="pdp-shimmer" style={{ width: '75%', height: '16px', borderRadius: '2px' }} />
          </div>

          {/* Size Options Skeleton */}
          <div>
            <div className="pdp-shimmer" style={{ width: '60px', height: '14px', marginBottom: '10px', borderRadius: '2px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="pdp-shimmer" style={{ width: '50px', height: '40px', borderRadius: '2px' }} />
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="pdp-shimmer" style={{ width: '100%', height: '52px', borderRadius: '2px' }} />
            <div className="pdp-shimmer" style={{ width: '100%', height: '52px', borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
