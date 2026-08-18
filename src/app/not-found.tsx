import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h2>
      <p style={{ marginBottom: '2rem' }}>Could not find requested resource</p>
      <Link href="/" style={{ padding: '0.75rem 1.5rem', background: '#222', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
        Return Home
      </Link>
    </div>
  );
}
