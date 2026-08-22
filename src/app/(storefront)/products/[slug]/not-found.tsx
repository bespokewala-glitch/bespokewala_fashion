import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      padding: '12rem 2rem', 
      textAlign: 'center', 
      fontFamily: '"Jost", "Inter", sans-serif',
      backgroundColor: '#fff',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h2 style={{ 
        fontSize: '1.8rem', 
        fontWeight: 300, 
        letterSpacing: '0.2em', 
        marginBottom: '1rem',
        textTransform: 'uppercase',
        color: '#111'
      }}>
        Product Not Found
      </h2>
      <p style={{ 
        fontSize: '0.9rem',
        fontWeight: 300,
        letterSpacing: '0.05em',
        color: '#666',
        marginBottom: '3rem',
        maxWidth: '400px',
        lineHeight: '1.6'
      }}>
        We couldn't find the specific piece you were looking for. It may have been removed or is no longer available in our collection.
      </p>
      <Link 
        href="/" 
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 2.5rem',
          height: '50px',
          backgroundColor: '#000', 
          color: '#fff', 
          textDecoration: 'none', 
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontSize: '0.8rem',
          fontWeight: 400,
          transition: 'background-color 0.3s ease'
        }}
      >
        Return to Boutique
      </Link>
    </div>
  );
}
