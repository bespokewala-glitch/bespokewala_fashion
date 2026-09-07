"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X, Filter, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface ProductFiltersProps {
  totalCount: number;
  availableSubcategories?: string[];
  availableCollections?: string[];
  dynamicFilters?: {
    colors: string[];
    sizes: string[];
    categories: string[];
    productTypes: string[];
    occasions?: string[];
  };
}

export default function ProductFilters({ totalCount, availableSubcategories, availableCollections, dynamicFilters }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    occasion: true,
    fashion_line: false,
    gender: false,
    color: false,
    size: false,
    price: false,
  });

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);

  const sortOptions = [
    { label: 'FEATURED', value: 'featured' },
    { label: 'NEW ARRIVALS', value: 'newest' },
    { label: 'PRICE: LOW TO HIGH', value: 'price_asc' },
    { label: 'PRICE: HIGH TO LOW', value: 'price_desc' }
  ];

  // Close sort dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.mobile-sort-dropdown') && isSortOpen) {
        setIsSortOpen(false);
      }
      if (!target.closest('.desktop-sort-dropdown') && isDesktopSortOpen) {
        setIsDesktopSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen, isDesktopSortOpen]);

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
    setExpandedSections(prev => {
      // If mobile, we do strict accordion. If desktop, we allow multiple.
      // But to keep it simple and elegant everywhere, we'll do strict accordion for the new design.
      const isMobile = window.innerWidth <= 1024;
      if (isMobile) {
        return { [section]: !prev[section] }; // Close others
      } else {
        return { ...prev, [section]: !prev[section] }; // Allow multiple
      }
    });
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

  const hasMultipleCategories = dynamicFilters && dynamicFilters.categories && dynamicFilters.categories.length > 1;
  const hasMultipleProductTypes = dynamicFilters && dynamicFilters.productTypes && dynamicFilters.productTypes.length > 1;
  const availableColors = (dynamicFilters && dynamicFilters.colors) || [];
  const availableSizes = (dynamicFilters && dynamicFilters.sizes) || [];
  const availableOccasions = (dynamicFilters && dynamicFilters.occasions) || [];

  const getColorHex = (colorName: string) => {
    const map: Record<string, string> = {
      black: '#000000', ivory: '#FFFFF0', white: '#FFFFFF', red: '#C41E3A', navy: '#000080',
      emerald: '#50C878', blush: '#DE5D83', gold: '#D4AF37', silver: '#C0C0C0', pink: '#FFC0CB',
      blue: '#0000FF', green: '#008000', grey: '#808080', gray: '#808080', brown: '#A52A2A',
      beige: '#F5F5DC', yellow: '#FFFF00', purple: '#800080', orange: '#FFA500', magenta: '#FF00FF',
      olive: '#808000', maroon: '#800000', burgundy: '#800020'
    };
    return map[colorName.toLowerCase()] || '#cccccc';
  };

  return (
    <>
      {/* Filter Toggle Bar */}
      <div className="mobile-filter-bar">
        <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
          <Filter size={16} strokeWidth={1.5} />
          <span>FILTER {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
        </button>
        <div className="mobile-sort-dropdown" style={{ position: 'relative' }}>
          <button
            className="mobile-sort-btn"
            onClick={() => setIsSortOpen(!isSortOpen)}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
          >
            <span>{sortOptions.find(o => o.value === activeSort)?.label || 'FEATURED'}</span>
            {isSortOpen ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
          </button>

          {isSortOpen && (
            <div className="custom-sort-menu" role="listbox">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  className="custom-sort-option"
                  role="option"
                  aria-selected={activeSort === option.value}
                  onClick={() => {
                    updateFilter('sort', option.value);
                    setIsSortOpen(false);
                  }}
                >
                  <span className="sort-option-icon">{activeSort === option.value && <Check size={14} strokeWidth={2} />}</span>
                  <span className="sort-option-label">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Drawer */}
      <div className={`filter-container ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
        <div className="filter-overlay" onClick={() => setIsMobileFilterOpen(false)}></div>

        <div className="filter-content">
          <div className="filter-header">
            <h3>FILTERS</h3>
            <button onClick={() => setIsMobileFilterOpen(false)} className="close-filter-btn" aria-label="Close filters">
              <span style={{ fontSize: '2rem', lineHeight: 1, fontWeight: 300 }}>&times;</span>
            </button>
          </div>

          <div className="filter-body">
            {/* Sort inside drawer */}
            <div className="filter-section" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '2rem' }}>
              <div className="desktop-sort-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#666', letterSpacing: '0.05em' }}>{totalCount} PRODUCTS</span>
                <div className="desktop-sort-dropdown" style={{ position: 'relative' }}>
                  <button
                    className="desktop-sort-btn"
                    onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
                    aria-expanded={isDesktopSortOpen}
                    aria-haspopup="listbox"
                  >
                    <span>SORT BY: {sortOptions.find(o => o.value === activeSort)?.label || 'FEATURED'}</span>
                    {isDesktopSortOpen ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
                  </button>

                  {isDesktopSortOpen && (
                    <div className="custom-sort-menu desktop-menu" role="listbox">
                      {sortOptions.map(option => (
                        <button
                          key={option.value}
                          className="custom-sort-option"
                          role="option"
                          aria-selected={activeSort === option.value}
                          onClick={() => {
                            updateFilter('sort', option.value);
                            setIsDesktopSortOpen(false);
                          }}
                        >
                          <span className="sort-option-icon">{activeSort === option.value && <Check size={14} strokeWidth={2} />}</span>
                          <span className="sort-option-label">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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

            {/* Subcategory */}
            {availableSubcategories && availableSubcategories.length > 0 && (
              <div className="filter-section">
                <button className="filter-section-header" onClick={() => toggleSection('subcategory')}>
                  <span>SUBCATEGORY</span>
                  <span className="chevron-text">{expandedSections.subcategory ? '⌃' : '˅'}</span>
                </button>
                <div className={`filter-section-content ${expandedSections.subcategory ? 'expanded' : ''} two-column-grid`}>
                  <div className="filter-section-content-inner">
                    {availableSubcategories.map(sub => {
                      return (
                        <label key={sub} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={activeSubcategory === sub}
                            onChange={(e) => updateFilter('subcategory', e.target.checked ? sub : null)}
                          />
                          <span className="checkbox-custom">
                            {activeSubcategory === sub && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="checkbox-text">{sub.replace(/-/g, ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* OCCASION */}
            {availableOccasions && availableOccasions.length > 0 && (
              <div className="filter-section">
                <button className="filter-section-header" onClick={() => toggleSection('occasion')}>
                  <span>OCCASION</span>
                  <span className="chevron-text">{expandedSections.occasion ? '⌃' : '˅'}</span>
                </button>
                <div className={`filter-section-content ${expandedSections.occasion ? 'expanded' : ''} two-column-grid`}>
                  <div className="filter-section-content-inner">
                    {availableOccasions.map(occ => {
                      const isActive = searchParams.get('occasion') === occ;
                      return (
                        <label key={occ} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => updateFilter('occasion', e.target.checked ? occ : null)}
                          />
                          <span className="checkbox-custom">
                            {isActive && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="checkbox-text" style={{ textTransform: 'capitalize' }}>{occ.replace(/-/g, ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* FASHION LINE */}
            {hasMultipleProductTypes && (
              <div className="filter-section">
                <button className="filter-section-header" onClick={() => toggleSection('fashion_line')}>
                  <span>FASHION LINE</span>
                  <span className="chevron-text">{expandedSections.fashion_line ? '⌃' : '˅'}</span>
                </button>
                <div className={`filter-section-content ${expandedSections.fashion_line ? 'expanded' : ''}`}>
                  <div className="filter-section-content-inner">
                    {dynamicFilters?.productTypes.map(line => {
                      const isActive = searchParams.get('productType') === line;
                      return (
                        <label key={line} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => updateFilter('productType', e.target.checked ? line : null)}
                          />
                          <span className="checkbox-custom">
                            {isActive && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="checkbox-text" style={{ textTransform: 'capitalize' }}>{line.replace(/-/g, ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* GENDER */}
            {hasMultipleCategories && (
              <div className="filter-section">
                <button className="filter-section-header" onClick={() => toggleSection('gender')}>
                  <span>GENDER</span>
                  <span className="chevron-text">{expandedSections.gender ? '⌃' : '˅'}</span>
                </button>
                <div className={`filter-section-content ${expandedSections.gender ? 'expanded' : ''}`}>
                  <div className="filter-section-content-inner">
                    {dynamicFilters?.categories.map(gender => {
                      const isActive = searchParams.get('category') === gender;
                      return (
                        <label key={gender} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => updateFilter('category', e.target.checked ? gender : null)}
                          />
                          <span className="checkbox-custom">
                            {isActive && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="checkbox-text" style={{ textTransform: 'capitalize' }}>{gender.replace(/-/g, ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* COLOR */}
            {availableColors.length > 0 && (
              <div className="filter-section">
                <button className="filter-section-header" onClick={() => toggleSection('color')}>
                  <span>COLOR</span>
                  <span className="chevron-text">{expandedSections.color ? '⌃' : '˅'}</span>
                </button>
                <div className={`filter-section-content ${expandedSections.color ? 'expanded' : ''}`}>
                  <div className="filter-section-content-inner">
                    <div className="color-swatches-grid">
                      {availableColors.map(color => {
                        const isActive = searchParams.get('colors') === color.toLowerCase();
                        return (
                          <div key={color} className="color-swatch-wrapper" onClick={() => updateFilter('colors', isActive ? null : color.toLowerCase())}>
                            <button
                              className={`color-swatch ${isActive ? 'active' : ''}`}
                              style={{ backgroundColor: getColorHex(color) }}
                              aria-label={`Filter by ${color}`}
                            />
                            <span className="color-swatch-label" style={{ textTransform: 'capitalize' }}>{color}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIZE */}
            {availableSizes.length > 0 && (
              <div className="filter-section">
                <button className="filter-section-header" onClick={() => toggleSection('size')}>
                  <span>SIZE</span>
                  <span className="chevron-text">{expandedSections.size ? '⌃' : '˅'}</span>
                </button>
                <div className={`filter-section-content ${expandedSections.size ? 'expanded' : ''}`}>
                  <div className="filter-section-content-inner">
                    <div className="size-grid">
                      {availableSizes.map(size => {
                        const isActive = searchParams.get('size') === size;
                        return (
                          <button
                            key={size}
                            className={`size-btn ${isActive ? 'active' : ''}`}
                            onClick={() => updateFilter('size', isActive ? null : size)}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRICE */}
            <div className="filter-section">
              <button className="filter-section-header" onClick={() => toggleSection('price')}>
                <span>PRICE</span>
                <span className="chevron-text">{expandedSections.price ? '⌃' : '˅'}</span>
              </button>
              <div className={`filter-section-content ${expandedSections.price ? 'expanded' : ''}`}>
                <div className="filter-section-content-inner">
                  <form onSubmit={handlePriceSubmit} className="price-filter-form">
                    <div className="price-inputs">
                      <div className="price-input-wrapper">
                        <span>₹</span>
                        <input type="number" name="minPrice" placeholder="MIN" defaultValue={activeMinPrice} />
                      </div>
                      <div className="price-input-wrapper">
                        <span>₹</span>
                        <input type="number" name="maxPrice" placeholder="MAX" defaultValue={activeMaxPrice} />
                      </div>
                    </div>
                    <button type="submit" className="price-submit-btn">Apply</button>
                  </form>
                </div>
              </div>
            </div>

          </div>

          <div className="filter-footer">
            <button className="clear-all-btn-mobile" onClick={clearAllFilters}>CLEAR ALL</button>
            <button className="show-results-btn" onClick={() => setIsMobileFilterOpen(false)}>
              SHOW {totalCount} PRODUCTS
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .mobile-filter-bar {
          display: flex;
          justify-content: space-between;
          position: sticky;
          top: 60px;
          background: #fff;
          z-index: 90;
          padding: 0.5rem 1rem;
          align-items: center;
          min-width: 0;
        }
        
        .mobile-filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          font-family: inherit;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          color: #1c1c1c;
          padding: 0.5rem 0;
        }

        .mobile-sort-btn, .desktop-sort-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          font-family: inherit;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          color: #1c1c1c;
          padding: 0.5rem 0;
        }
        
        .custom-sort-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          max-width: calc(100vw - 32px);
          background: #fff;
          border: 1px solid #e5e5e5;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          z-index: 50;
          display: flex;
          flex-direction: column;
        }

        .custom-sort-menu.desktop-menu {
          max-width: 280px;
        }

        .custom-sort-option {
          display: flex;
          align-items: center;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          min-height: 44px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 0.08em;
          font-weight: 500;
          text-transform: uppercase;
          color: #1c1c1c;
          transition: background-color 0.2s ease;
        }

        .custom-sort-option:hover {
          background-color: #f9f9f9;
        }

        .sort-option-icon {
          width: 24px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-shrink: 0;
        }

        .sort-option-label {
          flex: 1;
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
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          color: var(--foreground);
          padding: 0;
        }
        
        .chevron-text {
          font-size: 1.2rem;
          font-weight: 300;
          color: #333;
          line-height: 1;
          transition: transform 0.3s ease;
        }
        
        /* Smooth Accordion Animation */
        .filter-section-content {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s ease-in-out, opacity 0.3s ease-in-out;
          opacity: 0;
        }
        
        .filter-section-content.expanded {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 1.5rem;
        }
        
        .filter-section-content-inner {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        /* 2-column layout for occasions/categories on mobile */
        .two-column-grid .filter-section-content-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem 1rem;
        }
        
        .filter-checkbox-label {
          display: flex;
          align-items: flex-start;
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
          flex-shrink: 0;
          margin-top: 0.1rem;
        }
        
        .filter-checkbox-label input:checked + .checkbox-custom {
          background: var(--foreground);
          border-color: var(--foreground);
          color: #fff;
        }
        
        .checkbox-text {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #333;
          line-height: 1.4;
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
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .clear-all-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          text-decoration: underline;
          cursor: pointer;
          color: #666;
          text-transform: uppercase;
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
          background: #f9f9f9;
          border: 1px solid #eaeaea;
          font-size: 0.75rem;
          cursor: pointer;
          border-radius: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .price-filter-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: space-between;
        }
        
        .price-input-wrapper {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #ccc;
          padding: 0.5rem 0;
          flex: 1;
        }
        
        .price-input-wrapper span {
          color: #666;
          font-size: 0.875rem;
          margin-right: 0.5rem;
        }
        
        .price-input-wrapper input {
          width: 100%;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
        
        .color-swatches-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem 1rem;
        }

        .color-swatch-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }
        
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid #eaeaea;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
        }
        
        .color-swatch.active {
          border: 1px solid var(--foreground);
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

        .color-swatch-label {
          font-size: 0.875rem;
          text-transform: capitalize;
          color: #333;
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .size-btn {
          border: 1px solid #eaeaea;
          background: transparent;
          padding: 0.75rem 0;
          text-align: center;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          color: #333;
          transition: all 0.2s ease;
        }

        .size-btn:hover {
          border-color: #999;
        }

        .size-btn.active {
          border-color: var(--foreground);
          background: var(--foreground);
          color: #fff;
        }

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
          background: rgba(0,0,0,0.4);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .filter-container.mobile-open .filter-overlay {
          opacity: 1;
        }
        
        .filter-content {
          position: absolute;
          top: 0;
          left: 0; /* Changed from right: 0 */
          width: 90%;
          max-width: 400px;
          height: 100vh;
          background: #fff;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%); /* Changed from 100% to slide from left */
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          box-shadow: 4px 0 24px rgba(0,0,0,0.1); /* Changed from -4px */
        }
        
        .filter-container.mobile-open .filter-content {
          transform: translateX(0);
        }
        
        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 1.5rem 2rem;
          border-bottom: 1px solid #eaeaea;
          position: sticky;
          top: 0;
          background: #fff;
          z-index: 10;
        }
        
        .filter-header h3 {
          font-size: 1.125rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 400;
        }
        
        .close-filter-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--foreground);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          margin-right: -0.5rem;
        }
        
        .filter-body {
          overflow-y: auto;
          padding: 1rem 2rem 4rem 2rem;
          flex: 1;
        }
        
        .filter-footer {
          display: flex;
          padding: 1.5rem;
          border-top: 1px solid #eaeaea;
          gap: 1rem;
          position: sticky;
          bottom: 0;
          background: #fff;
          z-index: 10;
        }
        
        .clear-all-btn-mobile {
          flex: 1;
          padding: 1rem;
          background: transparent;
          border: none;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.875rem;
          text-decoration: underline;
          text-underline-offset: 4px;
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

        /* Desktop Adjustments */
        @media (min-width: 1025px) {
          .two-column-grid .filter-section-content-inner {
            grid-template-columns: 1fr;
          }
          .mobile-filter-bar {
            top: 70px; /* slightly taller header on desktop */
          }
        }
      `}} />
    </>
  );
}
