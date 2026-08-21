import React from 'react';
import Link from 'next/link';

export default function CategoryNavigation({ data }: { data?: any }) {
  const defaultCategories = [
    {
      id: 'couture',
      title: 'COUTURE',
      link: '/products/couture',
    },
    {
      id: 'footwear',
      title: 'FOOTWEAR',
      link: '/products/footwear',
    },
    {
      id: 'jewellery',
      title: 'JEWELLERY',
      link: '/products/jewellery',
    }
  ];

  // Map CMS data if available, otherwise fallback
  const categories = data?.cards && data.cards.length === 3 
    ? data.cards 
    : defaultCategories;

  return (
    <section className="category-nav-section">
      <style>{`
        .category-nav-section {
          padding: 2.5rem 0;
          background-color: #fff;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .category-nav-list {
          display: flex;
          gap: 5rem;
          list-style: none;
          margin: 0;
          padding: 0;
          align-items: center;
        }
        
        .category-nav-link {
          font-size: 0.9rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #111;
          text-decoration: none;
          position: relative;
          padding: 0.5rem 0;
          transition: color 0.3s ease;
          white-space: nowrap;
          font-weight: 400;
        }
        
        /* Elegant underline on hover/active */
        .category-nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 1px;
          bottom: 0;
          left: 50%;
          background-color: #111;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        
        .category-nav-link:hover {
          color: #000;
        }
        
        .category-nav-link:hover::after {
          width: 100%;
        }

        /* Mobile Layout */
        @media (max-width: 768px) {
          .category-nav-section {
            padding: 1.5rem 1rem;
            /* Allow horizontal scroll ONLY if necessary */
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none; /* Firefox */
          }
          
          .category-nav-section::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }
          
          .category-nav-list {
            gap: 1.5rem;
            width: 100%;
            justify-content: center; /* Center items on mobile */
          }
          
          .category-nav-link {
            font-size: 0.75rem; /* Smaller font to fit all 3 */
            letter-spacing: 0.1em;
          }
        }
        
        /* Ultra-compact screens (360px and below) */
        @media (max-width: 380px) {
           .category-nav-list {
             gap: 1rem; /* Tighter gap to prevent wrapping/overflow */
           }
           .category-nav-link {
             font-size: 0.7rem;
           }
        }
      `}</style>
      
      <nav aria-label="Collections Navigation">
        <ul className="category-nav-list">
          {categories.map((category: any, idx: number) => (
            <li key={category.id || idx}>
              <Link href={category.link} className="category-nav-link">
                {category.title.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
