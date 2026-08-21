"use client";

import React, { useState, useEffect, useRef } from 'react';
import { normalizeImageUrl } from '@/lib/imageUrl';
import styles from './campaigns.module.css';
export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    linkUrl: '/products?productType=couture',
    videoUrl: '',
    category: 'couture',
    mediaType: 'image'
  });

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      alert('Please upload a valid media file (video or image)');
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
        const isVideo = result.videoUrl.match(/\.(mp4|webm|ogg)$/i) != null;
        setFormData(prev => ({ 
          ...prev, 
          videoUrl: result.videoUrl,
          mediaType: isVideo ? 'video' : 'image'
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
    if (!formData.videoUrl) {
      alert('Please upload a media file first');
      return;
    }

    try {
      const url = editingId ? `/api/campaigns/${editingId}` : '/api/campaigns';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ title: '', subtitle: '', linkUrl: '/products?productType=couture', videoUrl: '', category: 'couture', mediaType: 'image' });
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchCampaigns();
      } else {
        alert('Error saving campaign: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error submitting: ' + err.message);
    }
  };

  const handleEdit = (camp: any) => {
    setEditingId(camp._id);
    setFormData({
      title: camp.title || '',
      subtitle: camp.subtitle || '',
      linkUrl: camp.linkUrl || '/products?productType=couture',
      videoUrl: camp.videoUrl || '',
      category: camp.category || 'couture',
      mediaType: camp.mediaType || 'image'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert('Error deleting campaign: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }} className="admin-page-container">
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }} className={styles.header}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: 0 }}>Hero Campaigns Admin</h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'flex-start' }} className="admin-flex-row">
        {/* ADD NEW CAMPAIGN FORM */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }} className="admin-page-container">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>{editingId ? 'Edit Campaign' : 'Add New Campaign'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. INAYA SUMMER 2026"
                style={{ width: '100%', minHeight: '44px', boxSizing: 'border-box', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subtitle</label>
              <input 
                type="text" 
                value={formData.subtitle}
                onChange={e => setFormData({...formData, subtitle: e.target.value})}
                placeholder="e.g. NEW COLLECTION"
                style={{ width: '100%', minHeight: '44px', boxSizing: 'border-box', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Button Destination Link</label>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#666' }}>Where should the "Explore Now" button take the user?</p>
              <select 
                value={formData.linkUrl}
                onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                style={{ width: '100%', minHeight: '44px', boxSizing: 'border-box', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="/products?productType=couture">Couture</option>
                <option value="/products?productType=footwear">Footwear</option>
                <option value="/products?productType=jewellery">Jewellery</option>
              </select>
            </div>

            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                style={{ width: '100%', minHeight: '44px', boxSizing: 'border-box', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="couture">Couture</option>
                <option value="jewellery">Jewellery</option>
                <option value="footwear">Footwear</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* DRAG AND DROP ZONE */}
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Media File (Video or Image)</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: isDragging ? '2px dashed #000' : '2px dashed #ccc', 
                  backgroundColor: isDragging ? '#e9e9e9' : '#fff',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="admin-page-container"
              >
                {uploading ? (
                  <p>Uploading... please wait.</p>
                ) : formData.videoUrl ? (
                  <p style={{ color: 'green', fontWeight: 'bold' }}>File Uploaded: {formData.videoUrl.split('/').pop()}</p>
                ) : (
                  <p>Drag & Drop a video or image file here, or click to select</p>
                )}
                <input 
                  type="file" 
                  accept="video/*,image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  style={{ display: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="submit" 
                disabled={uploading || !formData.videoUrl}
                style={{ 
                  flex: 1,
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  backgroundColor: '#000', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: (uploading || !formData.videoUrl) ? 'not-allowed' : 'pointer',
                  opacity: (uploading || !formData.videoUrl) ? 0.5 : 1
                }}
              >
                {editingId ? 'Update Campaign' : 'Save Campaign'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ title: '', subtitle: '', linkUrl: '/products?productType=couture', videoUrl: '', category: 'couture', mediaType: 'image' });
                  }}
                  style={{ 
                    flex: 1,
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    backgroundColor: '#e0e0e0', 
                    color: '#000', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer'
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST EXISTING CAMPAIGNS */}
        <div style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Current Campaigns</h2>
          {loading ? <p>Loading...</p> : campaigns.length === 0 ? <p>No campaigns found.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {campaigns.map((camp) => {
                const isImage = camp.videoUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                return (
                <div key={camp._id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', display: 'flex', gap: '20px' }} className="admin-card-stack">
                  {isImage ? (
                    <img src={normalizeImageUrl(camp.videoUrl)} style={{ width: '150px', height: '100px', objectFit: 'cover', backgroundColor: '#000' }} alt="campaign" />
                  ) : (
                    <video src={normalizeImageUrl(camp.videoUrl)} style={{ width: '150px', height: '100px', objectFit: 'cover', backgroundColor: '#000' }} muted playsInline />
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{camp.title}</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem' }}>{camp.subtitle}</p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem' }}><strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{camp.category || 'general'}</span> ({camp.mediaType || (isImage ? 'image' : 'video')})</p>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.8rem' }}><strong>Link:</strong> {camp.linkUrl}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleEdit(camp)}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#1890ff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(camp._id)}
                        style={{ 
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
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
