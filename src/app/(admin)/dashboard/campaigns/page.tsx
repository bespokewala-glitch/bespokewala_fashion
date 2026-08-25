"use client";

import React, { useState, useEffect, useRef } from 'react';
import { normalizeImageUrl } from '@/lib/imageUrl';
import { ChevronDown, UploadCloud, FileVideo, FileImage } from 'lucide-react';
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hero Campaigns</h1>
        <p className={styles.description}>Manage homepage hero banners, videos and campaign destinations.</p>
      </div>
      
      <div className={styles.layoutGrid}>
        {/* ADD NEW CAMPAIGN FORM */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{editingId ? 'Edit Campaign' : 'Add New Campaign'}</h2>
          <p className={styles.cardSubtitle}>Create a campaign for homepage hero section</p>
          
          <form onSubmit={handleSubmit}>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. INAYA SUMMER 2026"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Subtitle</label>
              <input 
                type="text" 
                value={formData.subtitle}
                onChange={e => setFormData({...formData, subtitle: e.target.value})}
                placeholder="e.g. NEW COLLECTION"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Button Destination</label>
              <p className={styles.helperText}>Where should the "Explore Now" button take the user?</p>
              <div className={styles.selectWrapper}>
                <select 
                  value={formData.linkUrl}
                  onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                  className={styles.select}
                >
                  <option value="/products?productType=couture">Couture</option>
                  <option value="/products?productType=footwear">Footwear</option>
                  <option value="/products?productType=jewellery">Jewellery</option>
                </select>
                <ChevronDown className={styles.selectIcon} size={20} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <div className={styles.selectWrapper}>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className={styles.select}
                >
                  <option value="couture">Couture</option>
                  <option value="jewellery">Jewellery</option>
                  <option value="footwear">Footwear</option>
                  <option value="general">General</option>
                </select>
                <ChevronDown className={styles.selectIcon} size={20} />
              </div>
            </div>

            {/* DRAG AND DROP ZONE */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Media</label>
              
              {!formData.videoUrl ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''}`}
                >
                  {uploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="admin-spinner" style={{ width: '24px', height: '24px', border: '2px solid #ccc', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                      <p className={styles.uploadTitle}>Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className={styles.uploadIcon} size={32} />
                      <p className={styles.uploadTitle}>Upload Campaign Media</p>
                      <p className={styles.uploadSubtitle}>Drag & drop or Browse</p>
                      <p className={styles.uploadSubtitle} style={{ marginTop: '4px' }}>JPG, PNG, WEBP, MP4</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="video/*,image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    style={{ display: 'none' }} 
                  />
                </div>
              ) : (
                <div className={styles.uploadPreview}>
                  {formData.mediaType === 'image' ? (
                    <img src={normalizeImageUrl(formData.videoUrl)} className={styles.uploadPreviewThumb} alt="preview" />
                  ) : (
                    <div className={styles.uploadPreviewThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileVideo size={24} color="#666" />
                    </div>
                  )}
                  <div className={styles.uploadPreviewInfo}>
                    <p className={styles.uploadPreviewName}>{formData.videoUrl.split('/').pop()}</p>
                    <span 
                      className={styles.uploadPreviewChange}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, videoUrl: '', mediaType: 'image' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Remove/Change
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.btnGroup}>
              <button 
                type="submit" 
                disabled={uploading || !formData.videoUrl}
                className={styles.primaryBtn}
              >
                {uploading ? 'SAVING...' : editingId ? 'UPDATE CAMPAIGN' : 'SAVE CAMPAIGN'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ title: '', subtitle: '', linkUrl: '/products?productType=couture', videoUrl: '', category: 'couture', mediaType: 'image' });
                  }}
                  className={styles.secondaryBtn}
                >
                  CANCEL EDIT
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST EXISTING CAMPAIGNS */}
        <div className={styles.card} style={{ backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Current Campaigns</h2>
          
          {loading ? (
            <p className={styles.description}>Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <p className={styles.description}>No campaigns found.</p>
          ) : (
            <div className={styles.campaignList}>
              {campaigns.map((camp) => {
                const isImage = camp.videoUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                return (
                  <div key={camp._id} className={styles.campaignCard}>
                    {isImage ? (
                      <img src={normalizeImageUrl(camp.videoUrl)} className={styles.campaignThumb} alt="campaign" />
                    ) : (
                      <video src={normalizeImageUrl(camp.videoUrl)} className={styles.campaignThumb} muted playsInline />
                    )}
                    
                    <div className={styles.campaignInfo}>
                      <h3 className={styles.campaignTitle}>{camp.title || 'Untitled Campaign'}</h3>
                      <p className={styles.campaignSubtitle}>{camp.subtitle || 'No subtitle'}</p>
                      
                      <p className={styles.campaignMeta}>Category: <span>{camp.category || 'general'}</span></p>
                      <p className={styles.campaignMeta}>Link: <span>{camp.linkUrl}</span></p>
                      
                      <div className={styles.campaignActions}>
                        <button 
                          onClick={() => handleEdit(camp)}
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(camp._id)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
