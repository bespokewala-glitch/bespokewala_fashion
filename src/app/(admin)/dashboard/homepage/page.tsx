"use client";

import React, { useState, useEffect, useRef } from 'react';

const MediaPreview = ({ src, style, alt }: { src?: string, style?: any, alt?: string }) => {
  if (!src) return null;
  if (src.match(/\.(mp4|webm|ogg)$/i)) {
    return <video src={src} style={style} autoPlay loop muted playsInline />;
  }
  return <img src={src} style={style} alt={alt || 'Preview'} />;
};

export default function HomepageCMS() {
  const [sections, setSections] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State to track which field is currently expecting an image upload
  const [uploadTarget, setUploadTarget] = useState<{ section: string, field: string, index?: number } | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/homepage-sections');
      const data = await res.json();
      if (data.success) {
        const sectionMap: any = {};
        data.sections.forEach((sec: any) => {
          sectionMap[sec.sectionType] = sec.content;
        });
        setSections(sectionMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveSection = async (sectionType: string, content: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/homepage-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType, content })
      });
      const data = await res.json();
      if (data.success) {
        alert(`${sectionType} saved successfully!`);
      } else {
        alert(`Error saving ${sectionType}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUploadClick = (section: string, field: string, index?: number) => {
    setUploadTarget({ section, field, index });
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !uploadTarget) return;
    
    const file = e.target.files[0];
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        // Update the state with the new image URL
        const { section, field, index } = uploadTarget;
        setSections((prev: any) => {
          const updated = { ...prev };
          if (!updated[section]) updated[section] = {};
          
          if (index !== undefined) {
            // It's an array field
            if (!updated[section][field]) updated[section][field] = [];
            if (!updated[section][field][index]) updated[section][field][index] = {};
            updated[section][field][index].image = result.videoUrl;
          } else {
            // It's a top level field
            updated[section][field] = result.videoUrl;
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadTarget(null);
    }
  };

  const handleTextChange = (section: string, field: string, value: string, index?: number, subfield?: string) => {
    setSections((prev: any) => {
      const updated = { ...prev };
      if (!updated[section]) updated[section] = {};
      
      if (index !== undefined && subfield) {
        if (!updated[section][field]) updated[section][field] = [];
        if (!updated[section][field][index]) updated[section][field][index] = {};
        updated[section][field][index][subfield] = value;
      } else {
        updated[section][field] = value;
      }
      return updated;
    });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading CMS...</div>;

  const defaultGridItems = [{}, {}, {}, {}];
  const gridItems = sections.CuratedGrid?.items || defaultGridItems;

  const carouselItems = sections.LookbookCarousel?.items || [{}, {}, {}, {}, {}];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Homepage Content Manager</h1>
      </div>
      <p style={{ color: '#666', marginBottom: '20px' }}>Update the images and text for your advanced homepage sections here.</p>

      {/* Hidden File Input */}
      <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

      {/* 1. Curated Grid */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>1. Curated This Season (Grid)</h2>
        <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
          <input 
            placeholder="Main Title (e.g. Curated This Season)" 
            value={sections.CuratedGrid?.title || ''}
            onChange={e => handleTextChange('CuratedGrid', 'title', e.target.value)}
            style={{ padding: '10px', width: '100%' }}
          />
          <input 
            placeholder="Subtitle" 
            value={sections.CuratedGrid?.subtitle || ''}
            onChange={e => handleTextChange('CuratedGrid', 'subtitle', e.target.value)}
            style={{ padding: '10px', width: '100%' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Grid Item {i + 1}</h3>
              <div 
                onClick={() => handleFileUploadClick('CuratedGrid', 'items', i)}
                style={{ height: '100px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '10px', overflow: 'hidden' }}
              >
                {gridItems[i]?.image ? <MediaPreview src={gridItems[i].image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Click to Upload Image'}
              </div>
              <input placeholder="Title" value={gridItems[i]?.title || ''} onChange={e => handleTextChange('CuratedGrid', 'items', e.target.value, i, 'title')} style={{ width: '100%', marginBottom: '5px', padding: '5px' }} />
              <input placeholder="Link URL" value={gridItems[i]?.link || ''} onChange={e => handleTextChange('CuratedGrid', 'items', e.target.value, i, 'link')} style={{ width: '100%', padding: '5px' }} />
            </div>
          ))}
        </div>
        <button disabled={saving} onClick={() => saveSection('CuratedGrid', sections.CuratedGrid)} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>Save Grid Section</button>
      </div>

      {/* 2. Feature Banner */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>2. High Jewellery (Feature Banner)</h2>
        <div 
          onClick={() => handleFileUploadClick('FeatureBanner', 'image')}
          style={{ height: '150px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '20px', overflow: 'hidden' }}
        >
          {sections.FeatureBanner?.image ? <MediaPreview src={sections.FeatureBanner.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Click to Upload Background Image'}
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input placeholder="Title" value={sections.FeatureBanner?.title || ''} onChange={e => handleTextChange('FeatureBanner', 'title', e.target.value)} style={{ padding: '10px', width: '100%' }} />
          <input placeholder="Subtitle" value={sections.FeatureBanner?.subtitle || ''} onChange={e => handleTextChange('FeatureBanner', 'subtitle', e.target.value)} style={{ padding: '10px', width: '100%' }} />
          <input placeholder="Link URL" value={sections.FeatureBanner?.link || ''} onChange={e => handleTextChange('FeatureBanner', 'link', e.target.value)} style={{ padding: '10px', width: '100%' }} />
        </div>
        <button disabled={saving} onClick={() => saveSection('FeatureBanner', sections.FeatureBanner)} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>Save Feature Banner</button>
      </div>

      {/* 3. Split Showcase */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>3. Luminous (Split Showcase)</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Left Image (Model / Lifestyle)</h3>
          <div onClick={() => handleFileUploadClick('SplitShowcase', 'modelImage')} style={{ height: '200px', maxWidth: '300px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '1px dashed #ccc' }}>
            {sections.SplitShowcase?.modelImage ? <MediaPreview src={sections.SplitShowcase.modelImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Upload Model Image'}
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', marginBottom: '10px', marginTop: '30px' }}>Right Side (Product Slider)</h3>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>Upload up to 5 jewelry products to feature in the auto-playing slider.</p>
        
        <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '10px' }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const prod = sections.SplitShowcase?.products?.[i] || {};
            return (
              <div key={i} style={{ minWidth: '180px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                <div 
                  onClick={() => handleFileUploadClick('SplitShowcase', 'products', i)}
                  style={{ height: '150px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '10px', overflow: 'hidden' }}
                >
                  {prod.image ? <MediaPreview src={prod.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : `Product ${i + 1} Image`}
                </div>
                <input placeholder="Product Name" value={prod.name || ''} onChange={e => handleTextChange('SplitShowcase', 'products', e.target.value, i, 'name')} style={{ width: '100%', marginBottom: '5px', padding: '5px' }} />
                <input placeholder="Price (e.g. $12,000)" value={prod.price || ''} onChange={e => handleTextChange('SplitShowcase', 'products', e.target.value, i, 'price')} style={{ width: '100%', padding: '5px' }} />
              </div>
            );
          })}
        </div>
        
        <button disabled={saving} onClick={() => saveSection('SplitShowcase', sections.SplitShowcase)} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>Save Split Showcase</button>
      </div>

      {/* 4. Lookbook Carousel */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>4. Muses (Lookbook Carousel)</h2>
        <input placeholder="Subtitle (e.g. Where dreams are draped...)" value={sections.LookbookCarousel?.subtitle || ''} onChange={e => handleTextChange('LookbookCarousel', 'subtitle', e.target.value)} style={{ padding: '10px', width: '100%', marginBottom: '20px' }} />
        
        <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '10px' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ minWidth: '150px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
              <div 
                onClick={() => handleFileUploadClick('LookbookCarousel', 'items', i)}
                style={{ height: '120px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '10px', overflow: 'hidden' }}
              >
                {carouselItems[i]?.image ? <MediaPreview src={carouselItems[i].image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Upload Image'}
              </div>
              <input placeholder="Muse Name" value={carouselItems[i]?.name || ''} onChange={e => handleTextChange('LookbookCarousel', 'items', e.target.value, i, 'name')} style={{ width: '100%', padding: '5px' }} />
            </div>
          ))}
        </div>
        <button disabled={saving} onClick={() => saveSection('LookbookCarousel', sections.LookbookCarousel)} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>Save Lookbook</button>
      </div>
      
    </div>
  );
}
