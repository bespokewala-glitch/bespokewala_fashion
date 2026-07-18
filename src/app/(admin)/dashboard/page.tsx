import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Admin Overview</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        <div style={{ padding: '30px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Orders</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Manage customer orders and update statuses.</p>
          <Link href="/dashboard/orders" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#000', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
            View Orders
          </Link>
        </div>

        <div style={{ padding: '30px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Products</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Add, edit, or remove products from the catalog.</p>
          <Link href="/dashboard/products" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#000', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
            Manage Products
          </Link>
        </div>

        <div style={{ padding: '30px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Campaigns</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Manage hero videos and promotional banners.</p>
          <Link href="/dashboard/campaigns" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#000', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
            Manage Campaigns
          </Link>
        </div>

        <div style={{ padding: '30px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Users</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>View all registered users and administrators.</p>
          <Link href="/dashboard/users" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#000', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
            View Users
          </Link>
        </div>

      </div>
    </div>
  );
}
