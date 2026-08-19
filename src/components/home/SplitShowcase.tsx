"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function SplitShowcase({ data }: { data?: any }) {
  const modelImage = data?.modelImage || "https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80";
  
  // Hardcoded default products matching the luxury jewelry aesthetic
  const defaultProducts = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1605100804763-247f66126e28?auto=format&fit=crop&q=80",
      name: "Three Two Four Ring",
      price: "$12,000"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1599643478514-4a4e09b52342?auto=format&fit=crop&q=80", 
      name: "Drop Pendant",
      price: "$5,200"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80", 
      name: "Diamond Earrings",
      price: "$4,800"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80", 
      name: "Diamond Bracelet",
      price: "$7,500"
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&q=80", 
      name: "Ruby Ring",
      price: "$6,200"
    }
  ];

  const products = data?.products || defaultProducts;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [products.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % products.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);

  return (
    <section style={{ 
      display: 'flex', 
      width: '100%', 
      minHeight: '80vh',
      backgroundColor: '#fff',
      flexWrap: 'wrap'
    }} className="mobile-flex-col mobile-min-h-auto split-showcase-section">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtleFadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .slide-anim {
          animation: subtleFadeIn 0.8s ease forwards;
        }
      `}} />
      
      {/* Left side - Fixed Model Image */}
      <div className="split-showcase-image" style={{ flex: '1 1 50%', minWidth: '300px', minHeight: '400px', position: 'relative' }}>
        <OptimizedImage 
          src={modelImage || ''} 
          alt="Bespokewala model showcasing luxury jewellery"
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
          style={{ objectFit: 'cover' }}
          variant="medium"
          loading="lazy"
        />
      </div>

      {/* Right side - Auto-playing Slider */}
      <div className="split-showcase-content mobile-section-py mobile-px-container" style={{ 
        flex: '1 1 50%', 
        minWidth: '300px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '4rem 2rem 2rem 2rem',
        textAlign: 'center',
        backgroundColor: '#fff',
        position: 'relative'
      }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }} className="mobile-label-clamp">Our Collection</h2>
          <div style={{ width: '30px', height: '1px', backgroundColor: '#ccc', margin: '0 auto' }} />
        </div>

        {/* Main Slider Area */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <Link href={products[currentIndex].slug ? `/products/${products[currentIndex].slug}` : '#'} key={currentIndex} className="slide-anim" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 3rem', textDecoration: 'none' }} aria-label={`View ${products[currentIndex].name}`}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', height: '300px', marginBottom: '1.5rem' }} className="mobile-slider-img">
              <OptimizedImage 
                src={products[currentIndex].image || ''} 
                alt={products[currentIndex].name ? `Bespokewala ${products[currentIndex].name}` : 'Bespokewala luxury product'}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'contain' }}
                variant="thumbnail"
                loading="lazy"
              />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 400, color: '#333', marginBottom: '0.5rem', fontFamily: 'serif' }} className="mobile-h3-clamp">{products[currentIndex].name}</h3>
            <p style={{ fontSize: '1rem', color: '#888' }} className="mobile-body-clamp">{products[currentIndex].price}</p>
          </Link>
          
          {/* Pagination Dots */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }} className="mobile-section-mt">
            {products.map((_: any, idx: number) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{ 
                  width: '6px', height: '6px', borderRadius: '50%', 
                  backgroundColor: idx === currentIndex ? '#333' : '#e0e0e0',
                  cursor: 'pointer', transition: 'background-color 0.3s',
                  border: 'none', padding: 0
                }} 
              />
            ))}
          </div>
        </div>


        
      </div>
    </section>
  );
}
