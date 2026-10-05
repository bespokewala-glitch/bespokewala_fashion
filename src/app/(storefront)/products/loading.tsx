export default function ProductsLoading() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '4.5rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f3ede6 25%, #eae3dc 50%, #f3ede6 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite;
        }
      `}</style>

      {/* Heading Skeleton */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div className="skeleton-shimmer" style={{ width: '120px', height: '14px', margin: '0 auto 12px', borderRadius: '2px' }} />
        <div className="skeleton-shimmer" style={{ width: '280px', height: '32px', margin: '0 auto 12px', borderRadius: '2px' }} />
        <div className="skeleton-shimmer" style={{ width: '200px', height: '14px', margin: '0 auto', borderRadius: '2px' }} />
      </div>

      {/* Filter Bar Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ede8e2', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
        <div className="skeleton-shimmer" style={{ width: '140px', height: '20px', borderRadius: '2px' }} />
        <div className="skeleton-shimmer" style={{ width: '180px', height: '36px', borderRadius: '2px' }} />
      </div>

      {/* Product Grid Skeletons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '2.5rem 1.5rem',
        }}
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className="skeleton-shimmer"
              style={{
                width: '100%',
                aspectRatio: '3/4',
                borderRadius: '2px',
                marginBottom: '1rem',
              }}
            />
            <div className="skeleton-shimmer" style={{ width: '80%', height: '16px', marginBottom: '8px', borderRadius: '2px' }} />
            <div className="skeleton-shimmer" style={{ width: '40%', height: '14px', borderRadius: '2px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
