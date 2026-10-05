export default function AdminDashboardLoading() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: '1440px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes admin-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .admin-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: admin-shimmer 1.5s infinite;
        }
      `}</style>

      {/* Top Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="admin-shimmer" style={{ width: '200px', height: '28px', borderRadius: '4px' }} />
          <div className="admin-shimmer" style={{ width: '320px', height: '14px', borderRadius: '4px' }} />
        </div>
        <div className="admin-shimmer" style={{ width: '120px', height: '38px', borderRadius: '6px' }} />
      </div>

      {/* Stats Cards Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div className="admin-shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
            <div className="admin-shimmer" style={{ width: '120px', height: '28px', borderRadius: '4px' }} />
            <div className="admin-shimmer" style={{ width: '140px', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="admin-shimmer" style={{ width: '160px', height: '20px', borderRadius: '4px' }} />
          <div className="admin-shimmer" style={{ width: '240px', height: '36px', borderRadius: '6px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="admin-shimmer"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '4px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
