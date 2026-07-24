"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package } from 'lucide-react';

// We will fetch categories from the Taxonomy API dynamically now.

function AdminProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const productTypeParam = searchParams.get('productType');
  
  const [activeProductType, setActiveProductType] = useState(productTypeParam || '');
  const [menuImages, setMenuImages] = useState<string[]>(['', '', '']);
  const [menuSettingsCategory, setMenuSettingsCategory] = useState<'womens' | 'mens'>('womens');
  const [savingMenuImages, setSavingMenuImages] = useState(false);

  useEffect(() => {
    if (productTypeParam && ['couture', 'jewellery', 'accessories'].includes(productTypeParam)) {
      setActiveProductType(productTypeParam);
      setFormData(prev => ({ ...prev, productType: productTypeParam, category: 'womens' }));
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
    sizes: [] as string[],
    inventoryCount: '10',
    isFeatured: false,
  });

  const fetchProductsAndTaxonomies = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const [productsRes, taxRes] = await Promise.all([
        fetch(`${baseUrl}/api/products`),
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

  useEffect(() => {
    fetchProductsAndTaxonomies();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Please upload a product image first');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      productType: formData.productType,
      category: formData.category,
      subcategory: formData.subcategory,
      collectionName: formData.collectionName,
      occasion: formData.occasion,
      images: [formData.imageUrl],
      referenceImages: formData.referenceImages,
      sizes: formData.sizes,
      inventoryCount: Number(formData.inventoryCount),
      isFeatured: formData.isFeatured,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData({ 
          name: '', description: '', price: '', originalPrice: '', 
          productType: activeProductType, category: 'womens', subcategory: '', collectionName: '', occasion: '', imageUrl: '', 
          referenceImages: { front: '', back: '', left: '', right: '' },
          sizes: [],
          inventoryCount: '10', isFeatured: false 
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchProductsAndTaxonomies();
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Products Admin</h1>
      </div>

      {!activeProductType ? (
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <Package size={48} style={{ margin: '0 auto 20px', opacity: 0.5, display: 'block' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#333' }}>Select a Product Type</h2>
          <p>Please select a product type (e.g. Couture, Jewellery) from the sidebar to view and manage its products.</p>
        </div>
      ) : (
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexDirection: 'column' }}>
        {/* MEGA MENU SETTINGS */}
        <div style={{ width: '100%', backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, textTransform: 'capitalize' }}>Mega Menu Images ({activeProductType})</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setMenuSettingsCategory('womens')}
                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #000', backgroundColor: menuSettingsCategory === 'womens' ? '#000' : '#fff', color: menuSettingsCategory === 'womens' ? '#fff' : '#000', cursor: 'pointer' }}
              >
                Womens
              </button>
              <button 
                onClick={() => setMenuSettingsCategory('mens')}
                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #000', backgroundColor: menuSettingsCategory === 'mens' ? '#000' : '#fff', color: menuSettingsCategory === 'mens' ? '#fff' : '#000', cursor: 'pointer' }}
              >
                Mens
              </button>
            </div>
          </div>
          <p style={{ color: '#666', marginBottom: '20px' }}>Upload exactly 3 portrait images to display in the {activeProductType} {'->'} {menuSettingsCategory} mega menu dropdown.</p>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            {[0, 1, 2].map((index) => (
              <div key={index} style={{ flex: 1, border: '2px dashed #ccc', padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '4px' }}>
                {menuImages[index] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={menuImages[index]} alt={`Menu Image ${index + 1}`} style={{ height: '150px', objectFit: 'contain', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => { const newArr = [...menuImages]; newArr[index] = ''; setMenuImages(newArr); }} style={{ padding: '5px 10px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>Slot {index + 1}</p>
                    <label style={{ display: 'inline-block', marginTop: '10px', padding: '8px 15px', backgroundColor: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
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
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button 
              onClick={handleSaveMenuImages}
              disabled={savingMenuImages}
              style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: savingMenuImages ? 'not-allowed' : 'pointer', opacity: savingMenuImages ? 0.7 : 1 }}
            >
              {savingMenuImages ? 'Saving...' : 'Save Menu Images'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', width: '100%' }}>
          {/* ADD NEW PRODUCT FORM */}
          <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textTransform: 'capitalize' }}>Add New {activeProductType} Product</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product Name</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Midnight Blue Velvet Sherwani"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
              <textarea 
                required 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed product description..."
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price ($)</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Original Price (Optional)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                  placeholder="0.00 (shows strike-through)"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department</label>
                <select 
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value, subcategory: '', collectionName: '', occasion: ''})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', textTransform: 'capitalize' }}
                >
                  <option value="">Select Department</option>
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
                  <label style={{ fontWeight: 'bold' }}>Dynamic Category</label>
                  <button type="button" onClick={() => handleQuickAddTaxonomy('category', 'subcategory')} style={{ fontSize: '0.8rem', padding: '2px 8px', cursor: 'pointer', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}>+ Add</button>
                </div>
                <select 
                  required
                  value={formData.subcategory}
                  onChange={e => setFormData({...formData, subcategory: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="" disabled>Select a category</option>
                  {taxonomies.filter(t => t.type === 'category' && t.enabled && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(activeProductType)) && (!t.genders || t.genders.length === 0 || t.genders.includes(formData.category))).map(tax => (
                    <option key={tax._id} value={tax.slug}>{tax.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontWeight: 'bold' }}>Collection (Optional)</label>
                  <button type="button" onClick={() => handleQuickAddTaxonomy('collection', 'collectionName')} style={{ fontSize: '0.8rem', padding: '2px 8px', cursor: 'pointer', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}>+ Add</button>
                </div>
                <select 
                  value={formData.collectionName}
                  onChange={e => setFormData({...formData, collectionName: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="">None</option>
                  {taxonomies.filter(t => t.type === 'collection' && t.enabled && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(activeProductType)) && (!t.genders || t.genders.length === 0 || t.genders.includes(formData.category))).map(tax => (
                    <option key={tax._id} value={tax.slug}>{tax.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontWeight: 'bold' }}>Occasion (Optional)</label>
                  <button type="button" onClick={() => handleQuickAddTaxonomy('occasion', 'occasion')} style={{ fontSize: '0.8rem', padding: '2px 8px', cursor: 'pointer', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}>+ Add</button>
                </div>
                <select 
                  value={formData.occasion}
                  onChange={e => setFormData({...formData, occasion: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="">None</option>
                  {taxonomies.filter(t => t.type === 'occasion' && t.enabled && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(activeProductType)) && (!t.genders || t.genders.length === 0 || t.genders.includes(formData.category))).map(tax => (
                    <option key={tax._id} value={tax.slug}>{tax.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Available Sizes</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'].map(size => (
                  <label key={size} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    cursor: 'pointer',
                    padding: '5px 10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: formData.sizes.includes(size) ? '#000' : '#fff',
                    color: formData.sizes.includes(size) ? '#fff' : '#000'
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
                  padding: '40px', 
                  textAlign: 'center',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {uploading ? (
                  <p>Uploading... please wait.</p>
                ) : formData.imageUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <img src={formData.imageUrl} alt="preview" style={{ maxHeight: '100px', objectFit: 'contain', marginBottom: '10px' }} />
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
                          <img src={currentImage} alt={angle.label} style={{ height: '80px', objectFit: 'contain', marginBottom: '10px' }} />
                          <button type="button" onClick={() => handleRemoveImage(angle.key)} style={{ padding: '4px 8px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Remove</button>
                        </div>
                      ) : (
                        <div>
                          <label style={{ 
                            display: 'inline-block', 
                            padding: '8px 15px', 
                            backgroundColor: '#f5f5f5', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            fontSize: '0.8rem' 
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

            <button 
              type="submit" 
              disabled={uploading || !formData.imageUrl}
              style={{ 
                marginTop: '10px', 
                padding: '12px', 
                backgroundColor: '#000', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: (uploading || !formData.imageUrl) ? 'not-allowed' : 'pointer',
                opacity: (uploading || !formData.imageUrl) ? 0.5 : 1
              }}
            >
              Save Product
            </button>
          </form>
        </div>

        {/* LIST EXISTING PRODUCTS */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textTransform: 'capitalize' }}>{activeProductType} Products</h2>
          {loading ? <p>Loading...</p> : products.filter(p => p.productType === activeProductType).length === 0 ? <p>No products found in this category.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {products.filter(p => p.productType === activeProductType).map((prod) => (
                <div key={prod._id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', display: 'flex', gap: '20px', position: 'relative' }}>
                  {prod.isFeatured && (
                    <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'gold', color: '#000', padding: '5px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      FEATURED
                    </span>
                  )}
                  {prod.images && prod.images[0] && (
                    <img src={prod.images[0]} style={{ width: '100px', height: '100px', objectFit: 'cover', backgroundColor: '#f5f5f5', borderRadius: '4px' }} alt={prod.name} />
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{prod.name}</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#000', fontWeight: 'bold', fontSize: '1rem' }}>
                      ${prod.price.toFixed(2)}
                      {prod.originalPrice && <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: '10px', fontSize: '0.9rem' }}>${prod.originalPrice.toFixed(2)}</span>}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem' }}>
                      <strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{prod.category} / {prod.subcategory}</span>
                      {prod.collectionName && <span> | <strong>Collection:</strong> {prod.collectionName}</span>}
                      {prod.occasion && <span> | <strong>Occasion:</strong> {prod.occasion}</span>}
                    </p>
                    <button 
                      onClick={() => handleDelete(prod._id)}
                      style={{ 
                        marginTop: '10px',
                        padding: '6px 12px', 
                        backgroundColor: '#ff4d4f', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
