import Link from 'next/link';

export const metadata = {
  title: '404 - Page Not Found | Bespokewala Atelier',
  description: 'The requested luxury creation, collection, or page could not be found.',
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d0d0d',
        color: '#f5f0eb',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          padding: '3.5rem 2.5rem',
          borderRadius: '4px',
          border: '1px solid rgba(200, 169, 110, 0.25)',
          background: 'radial-gradient(ellipse at center, rgba(30, 25, 20, 0.7) 0%, rgba(13, 13, 13, 0.95) 100%)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.8rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#c8a96e',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          Bespokewala Atelier
        </span>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            margin: '0 0 1rem',
            color: '#fff',
            lineHeight: 1.1,
          }}
        >
          404
        </h1>

        <div
          style={{
            width: '60px',
            height: '1px',
            backgroundColor: '#c8a96e',
            margin: '0 auto 1.5rem',
            opacity: 0.8,
          }}
        />

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            color: '#e5ded5',
          }}
        >
          Creation Not Located
        </h2>

        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.8,
            color: '#a89f91',
            marginBottom: '2.5rem',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 300,
          }}
        >
          The page or bespoke piece you are seeking is either unavailable or has been relocated within our couture collection.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.9rem 2rem',
              backgroundColor: '#c8a96e',
              color: '#0d0d0d',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '2px',
              transition: 'background-color 0.2s ease',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            Return to Atelier
          </Link>

          <Link
            href="/products"
            style={{
              display: 'inline-block',
              padding: '0.9rem 2rem',
              backgroundColor: 'transparent',
              color: '#f5f0eb',
              border: '1px solid rgba(200, 169, 110, 0.4)',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '2px',
              transition: 'all 0.2s ease',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            Explore Collections
          </Link>
        </div>
      </div>
    </main>
  );
}
