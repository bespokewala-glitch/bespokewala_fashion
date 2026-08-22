"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X, Filter, ChevronDown, Check } from 'lucide-react';

interface ProductFiltersProps {
  totalCount: number;
  availableSubcategories?: string[];
  availableCollections?: string[];
}

export default function ProductFilters({ totalCount, availableSubcategories, availableCollections }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    category: true,
    color: true,
  });

  // Close mobile filter on navigation
  useEffect(() => {
    setIsMobileFilterOpen(false);
  }, [pathname, searchParams]);

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileFilterOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key: string, value: string | null) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === null) {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    // Reset to page 1 when filtering
    current.delete('page');
    router.push(`${pathname}?${current.toString()}`);
  };

  const clearAllFilters = () => {
    // Keep the 'q' param if it exists, otherwise clear everything
    const q = searchParams.get('q');
    if (q) {
      router.push(`${pathname}?q=${encodeURIComponent(q)}`);
    } else {
      router.push(pathname);
    }
  };

  const activeSort = searchParams.get('sort') || 'featured';
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeSubcategory = searchParams.get('subcategory');

  const activeFiltersCount = Array.from(searchParams.keys()).filter(k => !['page', 'sort', 'q'].includes(k)).length;

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const min = (form.elements.namedItem('minPrice') as HTMLInputElement).value;
    const max = (form.elements.namedItem('maxPrice') as HTMLInputElement).value;
    
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (min) current.set('minPrice', min); else current.delete('minPrice');
    if (max) current.set('maxPrice', max); else current.delete('maxPrice');
    current.delete('page');
    router.push(`${pathname}?${current.toString()}`);
  };

  return (
    <>
      {/* Mobile Filter Toggle Bar */}
      <div className="mobile-filter-bar desktop-hide">
        <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
          <Filter size={18} />
          <span>FILTER {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
        </button>
        <div className="mobile-sort-dropdown">
          <select 
            value={activeSort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="mobile-sort-select"
          >
            <option value="featured">Featured</option>
            <option value="newest">New Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Desktop Filter Sidebar & Mobile Bottom Sheet */}
      <div className={`filter-container ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
        <div className="filter-overlay desktop-hide" onClick={() => setIsMobileFilterOpen(false)}></div>
        
        <div className="filter-content">
          <div className="filter-header desktop-hide">
            <h3>Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)} className="close-filter-btn">
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="filter-body">
            {/* Desktop Sort - Hidden on mobile */}
            <div className="filter-section mobile-hide" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '2rem' }}>
               <div className="desktop-sort-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '0.875rem', color: '#666' }}>{totalCount} Products</span>
                 <select 
                    value={activeSort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    <option value="featured">Sort by: Featured</option>
                    <option value="newest">New Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
               </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="active-filters">
                <div className="active-filters-header">
                  <span className="active-filters-title">Active Filters</span>
                  <button className="clear-all-btn" onClick={clearAllFilters}>Clear All</button>
                </div>
                <div className="active-filter-chips">
                  {Array.from(searchParams.entries()).map(([key, value]) => {
                    if (['page', 'sort', 'q'].includes(key)) return null;
                    return (
                      <button key={`${key}-${value}`} className="filter-chip" onClick={() => updateFilter(key, null)}>
                        {key === 'minPrice' ? `Min: ₹${value}` : key === 'maxPrice' ? `Max: ₹${value}` : value}
                        <X size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories/Subcategories */}
            {availableSubcategories && availableSubcategories.length > 0 && (
              <div className="filter-section">
                <button className="filter-section-header" onClick={() => toggleSection('category')}>
                  <span>Category</span>
                  <ChevronDown size={18} className={`chevron ${expandedSections.category ? 'expanded' : ''}`} />
                </button>
                {expandedSections.category && (
                  <div className="filter-section-content">
                    {availableSubcategories.map(sub => (
                      <label key={sub} className="filter-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={activeSubcategory === sub}
                          onChange={(e) => updateFilter('subcategory', e.target.checked ? sub : null)}
                        />
                        <span className="checkbox-custom">
                          {activeSubcategory === sub && <Check size={12} />}
                        </span>
                        <span className="checkbox-text">{sub.replace(/-/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            <div className="filter-section">
              <button className="filter-section-header" onClick={() => toggleSection('price')}>
                <span>Price Range</span>
                <ChevronDown size={18} className={`chevron ${expandedSections.price ? 'expanded' : ''}`} />
              </button>
              {expandedSections.price && (
                <div className="filter-section-content">
                  <form onSubmit={handlePriceSubmit} className="price-filter-form">
                    <div className="price-inputs">
                      <div className="price-input-wrapper">
                        <span>₹</span>
                        <input type="number" name="minPrice" placeholder="Min" defaultValue={activeMinPrice} />
                      </div>
                      <span className="price-separator">-</span>
                      <div className="price-input-wrapper">
                        <span>₹</span>
                        <input type="number" name="maxPrice" placeholder="Max" defaultValue={activeMaxPrice} />
                      </div>
                    </div>
                    <button type="submit" className="price-submit-btn">Apply</button>
                  </form>
                </div>
              )}
            </div>

            {/* Example Color Filter (Hardcoded for demo) */}
            <div className="filter-section">
              <button className="filter-section-header" onClick={() => toggleSection('color')}>
                <span>Color</span>
                <ChevronDown size={18} className={`chevron ${expandedSections.color ? 'expanded' : ''}`} />
              </button>
              {expandedSections.color && (
                <div className="filter-section-content">
                  <div className="color-swatches">
                    {['black', 'white', 'red', 'gold', 'emerald'].map(color => {
                      const isActive = searchParams.get('colors') === color;
                      return (
                        <button 
                          key={color} 
                          className={`color-swatch ${isActive ? 'active' : ''}`}
                          style={{ backgroundColor: color === 'gold' ? '#D4AF37' : color === 'emerald' ? '#50C878' : color }}
                          onClick={() => updateFilter('colors', isActive ? null : color)}
                          aria-label={`Filter by ${color}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
          </div>
          
          <div className="filter-footer desktop-hide">
             <button className="clear-all-btn-mobile" onClick={clearAllFilters}>Clear All</button>
             <button className="show-results-btn" onClick={() => setIsMobileFilterOpen(false)}>
               Show {totalCount} Results
             </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .mobile-filter-bar {
          display: flex;
          border-top: 1px solid #eaeaea;
          border-bottom: 1px solid #eaeaea;
          position: sticky;
          top: 60px; /* Adjust based on mobile header height */
          background: #fff;
          z-index: 90;
        }
        
        .mobile-filter-btn, .mobile-sort-dropdown {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: none;
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        
        .mobile-filter-btn {
          border-right: 1px solid #eaeaea;
          gap: 0.5rem;
        }
        
        .mobile-sort-select {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 0.875rem;
          text-align: center;
          outline: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .filter-container {
          width: 280px;
          flex-shrink: 0;
        }
        
        .filter-section {
          border-bottom: 1px solid #eaeaea;
          padding: 1.5rem 0;
        }
        
        .filter-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: none;
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          color: var(--foreground);
        }
        
        .chevron {
          transition: transform 0.3s ease;
        }
        .chevron.expanded {
          transform: rotate(180deg);
        }
        
        .filter-section-content {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .filter-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }
        
        .filter-checkbox-label input {
          display: none;
        }
        
        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .filter-checkbox-label input:checked + .checkbox-custom {
          background: var(--foreground);
          border-color: var(--foreground);
          color: #fff;
        }
        
        .checkbox-text {
          font-size: 0.875rem;
          text-transform: capitalize;
        }
        
        .active-filters {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .active-filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .active-filters-title {
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .clear-all-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          text-decoration: underline;
          cursor: pointer;
          color: #666;
        }
        
        .active-filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .filter-chip {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: #f4f4f4;
          border: 1px solid #eaeaea;
          font-size: 0.75rem;
          cursor: pointer;
          border-radius: 2px;
          text-transform: capitalize;
        }
        
        .price-filter-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .price-input-wrapper {
          display: flex;
          align-items: center;
          border: 1px solid #eaeaea;
          padding: 0.5rem;
          flex: 1;
        }
        
        .price-input-wrapper span {
          color: #666;
          font-size: 0.875rem;
          margin-right: 0.25rem;
        }
        
        .price-input-wrapper input {
          width: 100%;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 0.875rem;
        }
        
        .price-submit-btn {
          padding: 0.75rem;
          background: var(--foreground);
          color: #fff;
          border: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        .color-swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #eaeaea;
          cursor: pointer;
          position: relative;
        }
        
        .color-swatch.active {
          border: 2px solid var(--foreground);
        }
        .color-swatch.active::after {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 1px solid var(--foreground);
          border-radius: 50%;
        }

        @media (max-width: 1024px) {
          .filter-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1000;
            pointer-events: none;
          }
          
          .filter-container.mobile-open {
            pointer-events: auto;
          }
          
          .filter-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .filter-container.mobile-open .filter-overlay {
            opacity: 1;
          }
          
          .filter-content {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            max-height: 85vh;
            background: #fff;
            display: flex;
            flex-direction: column;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
          }
          
          .filter-container.mobile-open .filter-content {
            transform: translateY(0);
          }
          
          .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #eaeaea;
          }
          
          .filter-header h3 {
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          
          .close-filter-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--foreground);
          }
          
          .filter-body {
            overflow-y: auto;
            padding: 0 1.5rem;
            flex: 1;
          }
          
          .filter-footer {
            display: flex;
            padding: 1.5rem;
            border-top: 1px solid #eaeaea;
            gap: 1rem;
          }
          
          .clear-all-btn-mobile {
            flex: 1;
            padding: 1rem;
            background: transparent;
            border: 1px solid var(--foreground);
            color: var(--foreground);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 0.875rem;
          }
          
          .show-results-btn {
            flex: 2;
            padding: 1rem;
            background: var(--foreground);
            border: 1px solid var(--foreground);
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 0.875rem;
          }
        }
      `}} />
    </>
  );
}
