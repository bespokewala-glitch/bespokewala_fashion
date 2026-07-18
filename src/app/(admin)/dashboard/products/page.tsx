"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'couture',
    subcategory: '',
    imageUrl: '',
    inventoryCount: '10',
    isFeatured: false,
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUploadFile = async (file: File) => {
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
        setFormData(prev => ({ 
          ...prev, 
          imageUrl: result.videoUrl // The upload API returns 'videoUrl' for all files
        }));
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (err) {
      alert('Upload error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
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
      category: formData.category,
      subcategory: formData.subcategory,
      images: [formData.imageUrl],
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
          category: 'couture', subcategory: '', imageUrl: '', inventoryCount: '10', isFeatured: false 
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchProducts();
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
        fetchProducts();
      } else {
        alert('Error deleting product: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Products Admin</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/dashboard/campaigns" style={{ padding: '8px 16px', backgroundColor: '#eee', color: '#000', textDecoration: 'none', borderRadius: '4px' }}>Campaigns</Link>
          <Link href="/dashboard/products" style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>Products</Link>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        {/* ADD NEW PRODUCT FORM */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Add New Product</h2>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="couture">Couture</option>
                  <option value="jewellery">Jewellery</option>
                  <option value="diffusion">Diffusion</option>
                  <option value="beauty">Beauty</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subcategory</label>
                <input 
                  type="text" 
                  required
                  value={formData.subcategory}
                  onChange={e => setFormData({...formData, subcategory: e.target.value})}
                  placeholder="e.g. Menswear, Necklaces, Dresses"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product Image</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={formData.imageUrl} alt="preview" style={{ maxHeight: '100px', objectFit: 'contain', marginBottom: '10px' }} />
                    <p style={{ color: 'green', fontWeight: 'bold' }}>Image Uploaded Successfully</p>
                  </div>
                ) : (
                  <p>Drag & Drop an image file here, or click to select</p>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  style={{ display: 'none' }} 
                />
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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Current Products</h2>
          {loading ? <p>Loading...</p> : products.length === 0 ? <p>No products found.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {products.map((prod) => (
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
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem' }}><strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{prod.category} / {prod.subcategory}</span></p>
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
  );
}
