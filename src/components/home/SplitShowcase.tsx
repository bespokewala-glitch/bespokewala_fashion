import React from 'react';
import Link from 'next/link';

export default function SplitShowcase({ data }: { data?: any }) {
  const modelImage = data?.modelImage || "https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80";
  const productImage = data?.productImage || "https://images.unsplash.com/photo-1605100804763-247f66126e28?auto=format&fit=crop&q=80";
  const title = data?.title || "Luminous";
  const link = data?.link || "/products?category=couture";

  return (
    <section style={{ 
      display: 'flex', 
      width: '100%', 
      minHeight: '80vh',
      backgroundColor: '#fff',
      flexWrap: 'wrap' // for responsiveness
    }}>
      {/* Left side - Model/Lifestyle Image */}
      <div style={{ flex: '1 1 50%', minWidth: '300px', position: 'relative' }}>
        <img 
          src={modelImage} 
          alt="Model wearing jewellery"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', color: '#fff' }}>
          <Link href={link} style={{ 
            color: '#fff', 
            textDecoration: 'none', 
            fontSize: '0.9rem', 
            letterSpacing: '0.1em',
            borderBottom: '1px solid #fff',
            paddingBottom: '2px'
          }}>
            explore &gt;
          </Link>
        </div>
      </div>

      {/* Right side - Product Focus */}
      <div style={{ 
        flex: '1 1 50%', 
        minWidth: '300px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '4rem',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 300, 
          letterSpacing: '0.2em', 
          textTransform: 'uppercase',
          marginBottom: '3rem',
          color: '#333'
        }}>
          {title}
        </h2>
        
        <img 
          src={productImage} 
          alt="Product detail"
          style={{ 
            width: '60%', 
            maxWidth: '400px', 
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
    </section>
  );
}
