"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { normalizeImageUrl, getProductImageUrl, shouldBypassOptimizer } from '@/lib/imageUrl';
import styles from './products.module.css';

// We will fetch categories from the Taxonomy API dynamically now.

function AdminProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMegaMenuExpanded, setIsMegaMenuExpanded] = useState(false);
  const ITEMS_PER_PAGE = 20;

  const searchParams = useSearchParams();
  const productTypeParam = searchParams.get('productType');
  
  const [activeProductType, setActiveProductType] = useState(productTypeParam || '');
  const [menuImages, setMenuImages] = useState<string[]>(['', '', '']);
  const [menuSettingsCategory, setMenuSettingsCategory] = useState<'womens' | 'mens'>('womens');
  const [savingMenuImages, setSavingMenuImages] = useState(false);

  useEffect(() => {
    if (productTypeParam && ['couture', 'jewellery', 'footwear'].includes(productTypeParam)) {
      setActiveProductType(productTypeParam);
      setEditingId(null);
      setCurrentPage(1);
      setSearchQuery('');
      setDebouncedSearchQuery('');
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        productType: productTypeParam,
        category: 'womens',
        subcategory: '',
        collectionName: '',
        occasion: '',
        imageUrl: '',
        referenceImages: { front: '', back: '', left: '', right: '' },
        details: { styleCode: '', commodityName: '', composition: '', componentsCount: '', includes: '', shipping: '', disclaimer: '', legal: '' },
        sizes: [],
        colors: [],
        inventoryCount: '10',
        isFeatured: false,
        isNewArrival: false,
        seo: { title: '', description: '', keywords: '', canonicalUrl: '', noIndex: false },
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [productTypeParam]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    productType: 'couture',
    category: 'womens',
    subcategory: '',
    collectionName: '',
    occasion: '',
    imageUrl: '',
    referenceImages: { front: '', back: '', left: '', right: '' },
    details: { styleCode: '', commodityName: '', composition: '', componentsCount: '', includes: '', shipping: '', disclaimer: '', legal: '' },
    sizes: [] as string[],
    colors: [] as string[],
    inventoryCount: '10',
    isFeatured: false,
    isNewArrival: false,
    seo: { title: '', description: '', keywords: '', canonicalUrl: '', noIndex: false },
  });

  const fetchProductsAndTaxonomies = async (type?: string) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const queryParams = new URLSearchParams();
      queryParams.set('limit', '1000');
      if (type) queryParams.set('productType', type);

      const [productsRes, taxRes] = await Promise.all([
        fetch(`${baseUrl}/api/products?${queryParams.toString()}`),
        fetch(`${baseUrl}/api/taxonomies`)
      ]);

      if (productsRes.ok) {
        const pData = await productsRes.json();
        if (Array.isArray(pData)) setProducts(pData);
      }
      
      if (taxRes.ok) {
        const tData = await taxRes.json();
        setTaxonomies(tData);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddTaxonomy = async (type: 'category' | 'collection' | 'occasion', fieldName: 'subcategory' | 'collectionName' | 'occasion') => {
    const name = prompt(`Enter new ${type} name:`);
    if (!name) return;

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        type,
        name,
        slug,
        order: 0,
        enabled: true,
        productTypes: [activeProductType],
        genders: [formData.category] // This is the department
      };

      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newTax = await res.json();
        // Optimistically update taxonomies
        setTaxonomies(prev => [...prev, newTax]);
        // Auto-select the newly created taxonomy
        setFormData(prev => ({ ...prev, [fieldName]: newTax.slug }));
      } else {
        const error = await res.json();
        alert(`Failed to add ${type}: ${error.error || 'Unknown error'}`);
      }
    } catch (e) {
      alert(`An error occurred while adding the ${type}.`);
    }
  };

  const handleDeleteTaxonomy = async (slug: string, fieldName: 'subcategory' | 'collectionName' | 'occasion') => {
    const tax = taxonomies.find(t => t.slug === slug);
    if (!tax) return;
    if (!confirm(`Are you sure you want to delete "${tax.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/taxonomies/${tax._id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTaxonomies(prev => prev.filter(t => t._id !== tax._id));
        if (formData[fieldName] === slug) {
          setFormData(prev => ({ ...prev, [fieldName]: '' }));
        }
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (e) {
      alert(`An error occurred while deleting.`);
    }
  };

  useEffect(() => {
    fetchProductsAndTaxonomies(activeProductType);
  }, [activeProductType]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchMenuImages = async () => {
    if (!activeProductType) return;
    try {
      const res = await fetch(`/api/menu-images?productType=${activeProductType}&category=${menuSettingsCategory}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0 && data[0].images) {
          const fetchedImages = data[0].images;
          setMenuImages([
            fetchedImages[0] || '',
            fetchedImages[1] || '',
            fetchedImages[2] || '',
          ]);
        } else {
          setMenuImages(['', '', '']);
        }
      }
    } catch (e) {
      console.error('Fetch menu images error:', e);
    }
  };

  useEffect(() => {
    fetchMenuImages();
  }, [activeProductType, menuSettingsCategory]);

  const handleUploadFile = async (file: File, target: 'main' | 'front' | 'back' | 'left' | 'right') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => {
          if (target === 'main') {
            return { ...prev, imageUrl: result.videoUrl };
          } else {
            return {
              ...prev,
              referenceImages: {
                ...prev.referenceImages,
                [target]: result.videoUrl
              }
            };
          }
        });
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (err) {
      alert('Upload error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'front' | 'back' | 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file, target);
  };

  const handleRemoveImage = (target: 'main' | 'front' | 'back' | 'left' | 'right') => {
    setFormData(prev => {
      if (target === 'main') {
        return { ...prev, imageUrl: '' };
      } else {
        return {
          ...prev,
          referenceImages: {
            ...prev.referenceImages,
            [target]: ''
          }
        };
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, target: 'main' | 'front' | 'back' | 'left' | 'right') => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file, target);
  };

  const toggleSize = (size: string) => {
    setFormData(prev => {
      if (prev.sizes.includes(size)) {
        return { ...prev, sizes: prev.sizes.filter(s => s !== size) };
      } else {
        return { ...prev, sizes: [...prev.sizes, size] };
      }
    });
  };

  const toggleColor = (color: string) => {
    setFormData(prev => {
      if (prev.colors.includes(color)) {
        return { ...prev, colors: prev.colors.filter(c => c !== color) };
      } else {
        return { ...prev, colors: [...prev.colors, color] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Please upload a product image first');
      return;
    }

    // Only include SEO fields if at least one has been filled in by the admin.
    // This avoids persisting an empty seo object that would shadow fallback generation.
    const hasSeoData = formData.seo.title || formData.seo.description || formData.seo.keywords || formData.seo.canonicalUrl || formData.seo.noIndex;
    const payload = {
      name: formData.name,
      description: formData.description,
      price: activeProductType === 'jewellery' ? 0 : Number(formData.price),
      originalPrice: activeProductType === 'jewellery' ? undefined : (formData.originalPrice ? Number(formData.originalPrice) : undefined),
      productType: formData.productType,
      category: formData.category,
      subcategory: formData.subcategory,
      collectionName: formData.collectionName,
      occasion: formData.occasion,
      images: [formData.imageUrl],
      referenceImages: formData.referenceImages,
      details: formData.details,
      sizes: formData.sizes,
      colors: formData.colors,
      inventoryCount: Number(formData.inventoryCount),
      isFeatured: formData.isFeatured,
      isNewArrival: formData.isNewArrival,
      ...(hasSeoData ? { seo: formData.seo } : {}),
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData({ 
          name: '', description: '', price: '', originalPrice: '', 
          productType: activeProductType, category: 'womens', subcategory: '', collectionName: '', occasion: '', imageUrl: '', 
          referenceImages: { front: '', back: '', left: '', right: '' },
          details: { styleCode: '', commodityName: '', composition: '', componentsCount: '', includes: '', shipping: '', disclaimer: '', legal: '' },
          sizes: [],
          colors: [],
          inventoryCount: '10', isFeatured: false, isNewArrival: false,
          seo: { title: '', description: '', keywords: '', canonicalUrl: '', noIndex: false },
        });
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchProductsAndTaxonomies();
        setCurrentPage(1);
        setSearchQuery('');
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        alert(editingId ? 'Product updated successfully!' : 'Product created successfully!');
      } else {
        alert('Error saving product: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error submitting: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        fetchProductsAndTaxonomies();
      } else {
        alert('Error deleting product: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = async (prod: any) => {
    setIsFetchingProduct(true);
    setEditingId(prod._id);
    // Optimistically set the basic data, then fetch the full data
    setFormData({
      name: prod.name || '',
      description: 'Loading details...',
      price: prod.price?.toString() || '',
      originalPrice: prod.originalPrice?.toString() || '',
      productType: prod.productType || activeProductType,
      category: prod.category || 'womens',
      subcategory: prod.subcategory || '',
      collectionName: prod.collectionName || '',
      occasion: prod.occasion || '',
      imageUrl: (prod.images && prod.images[0]) ? prod.images[0] : '',
      referenceImages: prod.referenceImages || { front: '', back: '', left: '', right: '' },
      details: {
        styleCode: '',
        commodityName: '',
        composition: '',
        componentsCount: '',
        includes: '',
        shipping: '',
        disclaimer: '',
        legal: '',
      },
      sizes: [],
      colors: [],
      inventoryCount: prod.inventoryCount?.toString() || '10',
      isFeatured: prod.isFeatured || false,
      isNewArrival: prod.isNewArrival || false,
      // Optimistic placeholder — will be overwritten by full product fetch below
      seo: { title: '', description: '', keywords: '', canonicalUrl: '', noIndex: false },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      const res = await fetch(`/api/products/${prod._id}`);
      if (res.ok) {
        const fullProd = await res.json();
        setFormData({
          name: fullProd.name || '',
          description: fullProd.description || '',
          price: fullProd.price?.toString() || '',
          originalPrice: fullProd.originalPrice?.toString() || '',
          productType: fullProd.productType || activeProductType,
          category: fullProd.category || 'womens',
          subcategory: fullProd.subcategory || '',
          collectionName: fullProd.collectionName || '',
          occasion: fullProd.occasion || '',
          imageUrl: (fullProd.images && fullProd.images[0]) ? fullProd.images[0] : '',
          referenceImages: fullProd.referenceImages || { front: '', back: '', left: '', right: '' },
          details: {
            styleCode: fullProd.details?.styleCode || '',
            commodityName: fullProd.details?.commodityName || '',
            composition: fullProd.details?.composition || '',
            componentsCount: fullProd.details?.componentsCount || '',
            includes: fullProd.details?.includes || '',
            shipping: fullProd.details?.shipping || '',
            disclaimer: fullProd.details?.disclaimer || '',
            legal: fullProd.details?.legal || '',
          },
          sizes: fullProd.sizes || [],
          colors: fullProd.colors || [],
          inventoryCount: fullProd.inventoryCount?.toString() || '10',
          isFeatured: fullProd.isFeatured || false,
          isNewArrival: fullProd.isNewArrival || false,
          seo: {
            title: fullProd.seo?.title || '',
            description: fullProd.seo?.description || '',
            keywords: fullProd.seo?.keywords || '',
            canonicalUrl: fullProd.seo?.canonicalUrl || '',
            noIndex: fullProd.seo?.noIndex || false,
          },
        });
      } else {
        alert('Failed to load full product details for editing.');
      }
    } catch (e) {
      console.error('Failed to fetch full product details:', e);
      alert('Error loading full product details.');
    } finally {
      setIsFetchingProduct(false);
    }
  };

  const handleMenuImageUpload = async (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }
    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        setMenuImages(prev => {
          const newImages = [...prev];
          newImages[index] = result.videoUrl; // Actually image URL
          return newImages;
        });
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (err) {
      alert('Upload error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMenuImages = async () => {
    setSavingMenuImages(true);
    try {
      const res = await fetch('/api/menu-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: activeProductType,
          category: menuSettingsCategory,
          images: menuImages
        }),
      });
      if (res.ok) {
        alert('Menu images saved successfully!');
      } else {
        alert('Failed to save menu images');
      }
    } catch (err) {
      alert('Error saving menu images');
    } finally {
      setSavingMenuImages(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Products Admin</h1>
        </div>
      </div>

      {!activeProductType ? (
        <div className={styles.emptyState}>
          <Package size={48} style={{ margin: '0 auto 20px', opacity: 0.5, display: 'block' }} />
          <h2>Select a Product Type</h2>
          <p>Please select a product type (e.g. Couture, Jewellery) from the sidebar to view and manage its products.</p>
        </div>
      ) : (
      <div className={styles.mainLayout}>
        {/* MEGA MENU SETTINGS */}
        <div className={styles.megaMenuSection}>
          <div 
            className={styles.megaMenuHeader} 
            onClick={() => setIsMegaMenuExpanded(!isMegaMenuExpanded)}
            style={{ cursor: 'pointer', marginBottom: isMegaMenuExpanded ? '20px' : '0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mega Menu ({activeProductType})</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 300 }}>{isMegaMenuExpanded ? '−' : '+'}</span>
            </div>
          </div>
          
          {isMegaMenuExpanded && (
            <div style={{ borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setMenuSettingsCategory('womens'); }}
                  style={{ padding: '8px 24px', borderRadius: '4px', border: '1px solid #111', backgroundColor: menuSettingsCategory === 'womens' ? '#111' : '#fff', color: menuSettingsCategory === 'womens' ? '#fff' : '#111', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  Womens
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setMenuSettingsCategory('mens'); }}
                  style={{ padding: '8px 24px', borderRadius: '4px', border: '1px solid #111', backgroundColor: menuSettingsCategory === 'mens' ? '#111' : '#fff', color: menuSettingsCategory === 'mens' ? '#fff' : '#111', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  Mens
                </button>
              </div>
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.85rem' }}>Upload exactly 3 portrait images to display in the {activeProductType} {'->'} {menuSettingsCategory} mega menu dropdown.</p>
              
              <div className={styles.megaMenuCarousel}>
                {[0, 1, 2].map((index) => (
                  <div key={index} className={styles.megaMenuCard}>
                    {menuImages[index] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <img src={normalizeImageUrl(menuImages[index])} alt={`Menu Image ${index + 1}`} style={{ height: '150px', width: '100%', objectFit: 'cover', marginBottom: '10px', borderRadius: '8px' }} />
                        <button onClick={() => { const newArr = [...menuImages]; newArr[index] = ''; setMenuImages(newArr); }} className={styles.deleteBtn} style={{ width: '100%' }}>Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '12px' }}>Slot {index + 1}</p>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '44px', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>
                          {uploading ? 'Uploading...' : 'Upload Image'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleMenuImageUpload(file, index);
                            }}
                            disabled={uploading}
                            style={{ display: 'none' }} 
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={handleSaveMenuImages}
                  disabled={savingMenuImages}
                  className={styles.btnPrimary}
                  style={{ width: 'auto', padding: '14px 30px' }}
                >
                  {savingMenuImages ? 'Saving...' : 'Save Menu Images'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.flexRow}>
          {/* ADD NEW PRODUCT FORM */}
          <div className={styles.formSection}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textTransform: 'capitalize' }}>
            {editingId ? 'Edit' : 'Add New'} {activeProductType}
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', description: '', price: '', originalPrice: '', productType: activeProductType, category: 'womens', subcategory: '', collectionName: '', occasion: '', imageUrl: '', referenceImages: { front: '', back: '', left: '', right: '' }, details: { styleCode: '', commodityName: '', composition: '', componentsCount: '', includes: '', shipping: '', disclaimer: '', legal: '' }, sizes: [], colors: [], inventoryCount: '10', isFeatured: false, isNewArrival: false, seo: { title: '', description: '', keywords: '', canonicalUrl: '', noIndex: false } });
                }}
                style={{ fontSize: '0.8rem', marginLeft: '15px', padding: '4px 8px', cursor: 'pointer', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                Cancel Edit
              </button>
            )}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            
            <div className={styles.sectionHeader}>
              <h3>1. Product Information</h3>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Product Name</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Midnight Blue Velvet Sherwani"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea 
                required 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed product description..."
                className={styles.formTextarea}
                style={{ minHeight: '80px' }}
              />
            </div>

            {activeProductType !== 'jewellery' && (
              <div className={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Price ($)</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    className={styles.formInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Original Price (Optional)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                    placeholder="0.00"
                    className={styles.formInput}
                  />
                </div>
              </div>
            )}

            <div className={styles.sectionHeader}>
              <h3>2. Category & Collection</h3>
            </div>

            <div className={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label className={styles.formLabel}>{activeProductType === 'footwear' ? 'Footwear Type' : 'Department'}</label>
                <select 
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value, subcategory: '', collectionName: '', occasion: ''})}
                  className={styles.formSelect}
                  style={{ textTransform: 'capitalize' }}
                >
                  <option value="">Select {activeProductType === 'footwear' ? 'Type' : 'Department'}</option>
                  {activeProductType === 'couture' && (
                    <>
                      <option value="womens">Womens</option>
                      <option value="mens">Mens</option>
                      <option value="new-arrivals">New Arrivals</option>
                    </>
                  )}
                  {activeProductType === 'jewellery' && (
                    <>
                      <option value="signature-collection">Signature Collection</option>
                      <option value="diamond-collection">Diamond Collection</option>
                      <option value="menswear-collection">Menswear Collection</option>
                      <option value="new-arrivals">New Arrivals</option>
                    </>
                  )}
                  {activeProductType !== 'couture' && activeProductType !== 'jewellery' && (
                    <>
                      <option value="womens">Womens</option>
                      <option value="mens">Mens</option>
                    </>
                  )}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label className={styles.formLabel} style={{ marginBottom: 0 }}>Dynamic Category</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {formData.subcategory && (
                      <button type="button" onClick={() => handleDeleteTaxonomy(formData.subcategory, 'subcategory')} className={`${styles.badgeActionBtn} ${styles.delete}`}>− Delete</button>
                    )}
                    <button type="button" onClick={() => handleQuickAddTaxonomy('category', 'subcategory')} className={styles.badgeActionBtn}>+ Add</button>
                  </div>
                </div>
                <select 
                  required
                  value={formData.subcategory}
                  onChange={e => setFormData({...formData, subcategory: e.target.value})}
                  className={styles.formSelect}
                >
                  <option value="" disabled>Select a category</option>
                  {taxonomies.filter(t => t.type === 'category' && t.enabled && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(activeProductType)) && (!t.genders || t.genders.length === 0 || t.genders.includes(formData.category))).map(tax => (
                    <option key={tax._id} value={tax.slug}>{tax.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div style={{ flex: 1 }}>
                <div className={styles.labelRow}>
                  <label className={styles.formLabel}>Collection (Optional)</label>
                  <div className={styles.badgeGroup}>
                    {formData.collectionName && (
                      <button type="button" onClick={() => handleDeleteTaxonomy(formData.collectionName, 'collectionName')} className={`${styles.badgeActionBtn} ${styles.delete}`}>− Delete</button>
                    )}
                    <button type="button" onClick={() => handleQuickAddTaxonomy('collection', 'collectionName')} className={styles.badgeActionBtn}>+ Add</button>
                  </div>
                </div>
                <select 
                  value={formData.collectionName}
                  onChange={e => setFormData({...formData, collectionName: e.target.value})}
                  className={styles.formSelect}
                >
                  <option value="">None</option>
                  {taxonomies.filter(t => t.type === 'collection' && t.enabled && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(activeProductType)) && (!t.genders || t.genders.length === 0 || t.genders.includes(formData.category))).map(tax => (
                    <option key={tax._id} value={tax.slug}>{tax.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label className={styles.formLabel} style={{ marginBottom: 0 }}>Occasion (Optional)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {formData.occasion && (
                      <button type="button" onClick={() => handleDeleteTaxonomy(formData.occasion, 'occasion')} className={`${styles.badgeActionBtn} ${styles.delete}`}>− Delete</button>
                    )}
                    <button type="button" onClick={() => handleQuickAddTaxonomy('occasion', 'occasion')} className={styles.badgeActionBtn}>+ Add</button>
                  </div>
                </div>
                <select 
                  value={formData.occasion}
                  onChange={e => setFormData({...formData, occasion: e.target.value})}
                  className={styles.formSelect}
                >
                  <option value="">None</option>
                  {taxonomies.filter(t => t.type === 'occasion' && t.enabled && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(activeProductType)) && (!t.genders || t.genders.length === 0 || t.genders.includes(formData.category))).map(tax => (
                    <option key={tax._id} value={tax.slug}>{tax.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeProductType !== 'jewellery' && (
              <>
                <div style={{ backgroundColor: '#f9fafb', padding: '10px 15px', borderRadius: '6px', margin: '25px 0 15px', borderLeft: '4px solid #111' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3. Sizes</h3>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Available Sizes</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {(activeProductType === 'footwear'
                      ? (formData.category === 'womens'
                          ? ['EU 35', 'EU 35½', 'EU 36', 'EU 37', 'EU 37½', 'EU 38', 'EU 39', 'EU 39½', 'EU 40', 'EU 41', 'EU 41½', 'EU 42']
                          : ['EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'])
                      : ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom']
                    ).map(size => (
                      <label key={size} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        cursor: 'pointer',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        backgroundColor: formData.sizes.includes(size) ? '#000' : '#fff',
                        color: formData.sizes.includes(size) ? '#fff' : '#000',
                        fontSize: '0.875rem'
                      }}>
                        <input 
                          type="checkbox"
                          checked={formData.sizes.includes(size)}
                          onChange={() => toggleSize(size)}
                          style={{ display: 'none' }}
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className={styles.formGroup} style={{ marginTop: '20px' }}>
              <label className={styles.formLabel}>Available Colors</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['Black', 'Ivory', 'White', 'Red', 'Navy', 'Emerald', 'Blush', 'Gold', 'Silver', 'Pink', 'Blue', 'Green', 'Grey', 'Brown', 'Beige', 'Yellow', 'Purple', 'Orange', 'Magenta', 'Olive', 'Maroon', 'Burgundy'].map(color => (
                  <label key={color} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    cursor: 'pointer',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: formData.colors.includes(color.toLowerCase()) ? '#000' : '#fff',
                    color: formData.colors.includes(color.toLowerCase()) ? '#fff' : '#000',
                    fontSize: '0.875rem'
                  }}>
                    <input 
                      type="checkbox"
                      checked={formData.colors.includes(color.toLowerCase())}
                      onChange={() => toggleColor(color.toLowerCase())}
                      style={{ display: 'none' }}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              <input 
                type="checkbox" 
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
                style={{ width: '20px', height: '20px' }}
              />
              <label htmlFor="isFeatured" style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                Feature on Homepage (Shows in Featured Arrivals)
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              <input 
                type="checkbox" 
                id="isNewArrival"
                checked={formData.isNewArrival}
                onChange={e => setFormData({...formData, isNewArrival: e.target.checked})}
                style={{ width: '20px', height: '20px' }}
              />
              <label htmlFor="isNewArrival" style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                Mark as New Arrival (Shows on New Arrivals page)
              </label>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '10px 15px', borderRadius: '6px', margin: '25px 0 15px', borderLeft: '4px solid #111' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>4. Images</h3>
            </div>

            {/* DRAG AND DROP ZONE */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product Image (Main)</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'main')}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: isDragging ? '2px dashed #000' : '2px dashed #ccc', 
                  backgroundColor: isDragging ? '#e9e9e9' : '#fff',
                  padding: '20px', 
                  textAlign: 'center',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {uploading ? (
                  <p>Uploading... please wait.</p>
                ) : formData.imageUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <img src={normalizeImageUrl(formData.imageUrl)} alt="preview" style={{ maxHeight: '100px', objectFit: 'contain', marginBottom: '10px' }} />
                    <p style={{ color: 'green', fontWeight: 'bold', margin: '0 0 10px 0' }}>Image Uploaded</p>
                    <button type="button" onClick={() => handleRemoveImage('main')} style={{ padding: '5px 10px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                  </div>
                ) : (
                  <p>Drag & Drop an image file here, or click to select</p>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={(e) => handleFileChange(e, 'main')}
                  style={{ display: 'none' }} 
                />
              </div>
            </div>

            {/* REFERENCE IMAGES (OPTIONAL) */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reference Images (Optional)</label>
              <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>Upload additional angles for the outfit.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {([
                  { key: 'front', label: 'Front' },
                  { key: 'back', label: 'Back' },
                  { key: 'left', label: 'Left Side' },
                  { key: 'right', label: 'Right Side' }
                ] as const).map((angle) => {
                  const currentImage = formData.referenceImages[angle.key];
                  
                  return (
                    <div key={angle.key} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px', backgroundColor: '#fff', textAlign: 'center' }}>
                      <p style={{ fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '0.9rem' }}>{angle.label}</p>
                      
                      {currentImage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img src={normalizeImageUrl(currentImage)} alt={angle.label} style={{ height: '80px', objectFit: 'contain', marginBottom: '10px' }} />
                          <button type="button" onClick={() => handleRemoveImage(angle.key)} style={{ padding: '4px 8px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Remove</button>
                        </div>
                      ) : (
                        <div>
                          <label style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px 15px', 
                            minHeight: '44px',
                            backgroundColor: '#f5f5f5', 
                            border: '1px solid #ccc', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontSize: '0.8rem',
                            fontWeight: 500
                          }}>
                            {uploading ? 'Uploading...' : 'Select Image'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleFileChange(e, angle.key)}
                              disabled={uploading}
                              style={{ display: 'none' }} 
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PRODUCT DETAILS ACCORDION DATA */}
            <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fdfdfd' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold' }}>Product Details (Accordion Data)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Style Code</label>
                  <input type="text" value={formData.details.styleCode} onChange={e => setFormData({...formData, details: {...formData.details, styleCode: e.target.value}})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Name of Commodity</label>
                  <input type="text" value={formData.details.commodityName} onChange={e => setFormData({...formData, details: {...formData.details, commodityName: e.target.value}})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Composition</label>
                  <input type="text" value={formData.details.composition} onChange={e => setFormData({...formData, details: {...formData.details, composition: e.target.value}})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>No of Components</label>
                  <input type="text" value={formData.details.componentsCount} onChange={e => setFormData({...formData, details: {...formData.details, componentsCount: e.target.value}})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Includes</label>
                  <input type="text" value={formData.details.includes} onChange={e => setFormData({...formData, details: {...formData.details, includes: e.target.value}})} placeholder="e.g. 1 Piece - Lehenga, 1 Piece - Blouse, 1 Piece - Dupatta" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* ── SEO Section ───────────────────────────────────────────────────
                Optional manual SEO overrides. If left blank, metadata is auto-
                generated from the product name, description, category, etc.
                These fields are saved to product.seo in MongoDB.
            ────────────────────────────────────────────────────────────────── */}
            <div style={{ marginTop: '24px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f8f8', padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1rem' }}>🔍</span>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#333', letterSpacing: '0.03em' }}>SEO — Search Engine Optimisation</h3>
                <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: 'auto' }}>Optional — auto-generated if left blank</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* SEO Title */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>SEO Title</label>
                    <span style={{ fontSize: '0.75rem', color: (formData.seo.title.length > 60 || (formData.seo.title.length > 0 && formData.seo.title.length < 50)) ? '#e07000' : '#888' }}>
                      {formData.seo.title.length}/60 chars {formData.seo.title.length > 0 && formData.seo.title.length < 50 ? '(too short)' : formData.seo.title.length > 60 ? '(too long)' : formData.seo.title.length >= 50 ? '✓' : ''}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seo.title}
                    onChange={e => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })}
                    placeholder={`${formData.name || 'Product Name'} | Bespokewala`}
                    maxLength={80}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '0.73rem', color: '#999', margin: '4px 0 0' }}>50–60 characters recommended. Appears in browser tab and Google results. Leave blank to auto-generate.</p>
                </div>

                {/* Meta Description */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>Meta Description</label>
                    <span style={{ fontSize: '0.75rem', color: (formData.seo.description.length > 160 || (formData.seo.description.length > 0 && formData.seo.description.length < 100)) ? '#e07000' : '#888' }}>
                      {formData.seo.description.length}/160 chars {formData.seo.description.length > 0 && formData.seo.description.length < 100 ? '(too short)' : formData.seo.description.length > 160 ? '(too long)' : formData.seo.description.length >= 100 ? '✓' : ''}
                    </span>
                  </div>
                  <textarea
                    value={formData.seo.description}
                    onChange={e => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })}
                    placeholder={formData.description ? formData.description.substring(0, 140) + '…' : 'Enter a compelling meta description for search results'}
                    maxLength={200}
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '0.73rem', color: '#999', margin: '4px 0 0' }}>140–160 characters recommended. Shown in Google snippets. Leave blank to auto-generate from product description.</p>
                </div>

                {/* Keywords */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>Keywords</label>
                  <input
                    type="text"
                    value={formData.seo.keywords}
                    onChange={e => setFormData({ ...formData, seo: { ...formData.seo, keywords: e.target.value } })}
                    placeholder="e.g. bridal lehenga, wedding lehenga, red bridal outfit"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '0.73rem', color: '#999', margin: '4px 0 0' }}>Comma-separated. Used for meta keywords tag.</p>
                </div>

                {/* Canonical URL + No-Index row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>Canonical URL</label>
                    <input
                      type="text"
                      value={formData.seo.canonicalUrl}
                      onChange={e => setFormData({ ...formData, seo: { ...formData.seo, canonicalUrl: e.target.value } })}
                      placeholder={`https://www.bespokewala.com/products/${formData.name?.toLowerCase().replace(/\s+/g, '-') || 'product-slug'}`}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                    <p style={{ fontSize: '0.73rem', color: '#999', margin: '4px 0 0' }}>Leave blank unless this product has a duplicate URL that needs canonicalisation.</p>
                  </div>
                  <div style={{ paddingBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={formData.seo.noIndex}
                        onChange={e => setFormData({ ...formData, seo: { ...formData.seo, noIndex: e.target.checked } })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#c0392b' }}>No-Index</span>
                    </label>
                    <p style={{ fontSize: '0.73rem', color: '#999', margin: '4px 0 0', paddingLeft: '24px' }}>Hides from Google</p>
                  </div>
                </div>

                {/* Google Search Preview */}
                {(formData.seo.title || formData.name) && (
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>🔍 Google Search Preview</p>
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', background: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: '600px' }}>
                      {/* URL line */}
                      <div style={{ fontSize: '0.8rem', color: '#006621', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        https://www.bespokewala.com/products/{formData.name?.toLowerCase().replace(/\s+/g, '-') || 'product-slug'}
                      </div>
                      {/* Title */}
                      <div style={{ fontSize: '1.05rem', color: '#1a0dab', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.3', cursor: 'pointer' }}>
                        {formData.seo.title || `${formData.name}${formData.name ? ' | Bespokewala' : ''}`}
                      </div>
                      {/* Description */}
                      <div style={{ fontSize: '0.85rem', color: '#545454', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {formData.seo.description || formData.description || 'No meta description set — Google will pick a snippet from the page content.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={uploading || (!formData.imageUrl && !editingId)}
              className={styles.btnPrimary}
              style={{ marginTop: '20px' }}
            >
              {editingId ? 'Update Product' : 'Save Product'}
            </button>
          </form>

        </div>

        {/* LIST EXISTING PRODUCTS */}
        <div className={styles.productListSection} ref={listRef}>
          <div className={styles.listHeader}>
            <h2>{activeProductType} Products (Total: {products.filter(p => p.productType === activeProductType).length})</h2>
            <input 
              type="text" 
              placeholder="Search by name, category..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={styles.searchBar}
            />
          </div>
          
          {loading ? (
            <div className={styles.skeletonList}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={styles.skeletonCard}>
                  <div className={styles.skeletonImg}></div>
                  <div className={styles.skeletonInfo}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonPrice}></div>
                    <div className={styles.skeletonCategory}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (() => {
            const typeProducts = products.filter(p => p.productType === activeProductType);
            const filteredProducts = typeProducts.filter(p => {
              if (!debouncedSearchQuery) return true;
              const q = debouncedSearchQuery.toLowerCase();
              return (
                p.name?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.subcategory?.toLowerCase().includes(q) ||
                p.collectionName?.toLowerCase().includes(q) ||
                p.occasion?.toLowerCase().includes(q)
              );
            });
            const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
            const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

            if (typeProducts.length === 0) return <p>No products found in this category.</p>;
            if (filteredProducts.length === 0) return <p>No products match your search.</p>;

            return (
              <>
                <div className={styles.productList}>
                  {paginatedProducts.map((prod) => (
                    <div key={prod._id} className={styles.productCard} style={{ position: 'relative' }}>
                      {prod.isFeatured && (
                        <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'gold', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                          FEATURED
                        </span>
                      )}
                      {prod.images && prod.images[0] ? (
                        <div style={{ position: 'relative', width: '90px', height: '96px', flexShrink: 0 }}>
                          <Image 
                            src={getProductImageUrl(prod.images[0], 'micro')} 
                            alt={prod.name} 
                            fill
                            sizes="90px"
                            style={{ objectFit: 'cover', borderRadius: '8px' }}
                            unoptimized={shouldBypassOptimizer(prod.images[0])}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '90px', height: '96px', backgroundColor: '#f0f0f0', borderRadius: '8px', flexShrink: 0 }} />
                      )}
                      <div className={styles.productInfo}>
                        <h3>{prod.name}</h3>
                        <p className={styles.productPrice}>
                          ${prod.price.toFixed(2)}
                          {prod.originalPrice && <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: '10px', fontSize: '0.8rem', fontWeight: 'normal' }}>${prod.originalPrice.toFixed(2)}</span>}
                        </p>
                        <p className={styles.productCategory}>
                          <strong>Cat:</strong> <span style={{ textTransform: 'capitalize' }}>{prod.category} / {prod.subcategory}</span>
                          {prod.collectionName && <span> | <strong>Col:</strong> {prod.collectionName}</span>}
                          {prod.occasion && <span> | <strong>Occ:</strong> {prod.occasion}</span>}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button 
                            onClick={() => handleEdit(prod)}
                            className={styles.editBtn}
                            disabled={isFetchingProduct}
                          >
                            {isFetchingProduct && editingId === prod._id ? 'Loading...' : 'Edit'}
                          </button>
                          <button 
                            onClick={() => handleDelete(prod._id)}
                            className={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button 
                      onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      className={styles.pageBtn}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Page {currentPage} of {totalPages}</span>
                    <button 
                      onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === totalPages}
                      className={styles.pageBtn}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
