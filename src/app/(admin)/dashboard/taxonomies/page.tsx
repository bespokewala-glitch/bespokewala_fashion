"use client";

import React, { useState, useEffect } from 'react';

type TaxonomyType = 'collection' | 'occasion' | 'category';

interface ITaxonomy {
  _id: string;
  type: TaxonomyType;
  name: string;
  slug: string;
  order: number;
  enabled: boolean;
  productTypes: string[];
  genders: string[];
}

export default function AdminTaxonomiesPage() {
  const [taxonomies, setTaxonomies] = useState<ITaxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaxonomyType>('collection');
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    order: 0,
    enabled: true,
    productTypes: [] as string[],
    genders: [] as string[]
  });
  
  const [isEditing, setIsEditing] = useState(false);

  const fetchTaxonomies = async () => {
    try {
      const res = await fetch('/api/taxonomies');
      if (res.ok) {
        const data = await res.json();
        setTaxonomies(data);
      }
    } catch (e) {
      console.error('Failed to fetch taxonomies', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type: activeTab,
      name: formData.name,
      slug: formData.slug || undefined,
      order: Number(formData.order),
      enabled: formData.enabled,
      productTypes: formData.productTypes,
      genders: formData.genders
    };

    try {
      const url = isEditing ? `/api/taxonomies/${formData.id}` : '/api/taxonomies';
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        resetForm();
        fetchTaxonomies();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (e) {
      alert('An error occurred while saving.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`/api/taxonomies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTaxonomies();
      }
    } catch (e) {
      alert('An error occurred while deleting.');
    }
  };

  const handleEdit = (tax: ITaxonomy) => {
    setFormData({
      id: tax._id,
      name: tax.name,
      slug: tax.slug,
      order: tax.order,
      enabled: tax.enabled,
      productTypes: tax.productTypes || [],
      genders: tax.genders || []
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', slug: '', order: 0, enabled: true, productTypes: [], genders: [] });
    setIsEditing(false);
  };

  const handleCheckboxChange = (field: 'productTypes' | 'genders', value: string) => {
    setFormData(prev => {
      const array = prev[field];
      if (array.includes(value)) {
        return { ...prev, [field]: array.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...array, value] };
      }
    });
  };

  const filteredTaxonomies = taxonomies.filter(t => t.type === activeTab).sort((a, b) => a.order - b.order);

  const tabStyle = (type: TaxonomyType) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    backgroundColor: activeTab === type ? '#000' : '#f5f5f5',
    color: activeTab === type ? '#fff' : '#000',
    border: '1px solid #ddd',
    borderBottom: 'none',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    marginRight: '5px'
  });

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '30px' }}>Taxonomy Management</h1>
      
      <div style={{ display: 'flex', borderBottom: '2px solid #000', marginBottom: '20px' }}>
        <button style={tabStyle('collection')} onClick={() => { setActiveTab('collection'); resetForm(); }}>Collections</button>
        <button style={tabStyle('occasion')} onClick={() => { setActiveTab('occasion'); resetForm(); }}>Occasions</button>
        <button style={tabStyle('category')} onClick={() => { setActiveTab('category'); resetForm(); }}>Categories</button>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Form Section */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 20px 0', textTransform: 'capitalize' }}>
            {isEditing ? 'Edit' : 'Add New'} {activeTab}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Name</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Slug (optional, auto-generated)</label>
              <input 
                type="text" 
                value={formData.slug}
                onChange={e => setFormData({...formData, slug: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Order</label>
              <input 
                type="number" 
                required 
                value={formData.order}
                onChange={e => setFormData({...formData, order: Number(e.target.value)})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input 
                type="checkbox" 
                id="enabled"
                checked={formData.enabled}
                onChange={e => setFormData({...formData, enabled: e.target.checked})}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="enabled" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Enabled (Show in Navigation)</label>
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Applies to Product Types (Leave all unchecked for 'All')</label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {['couture', 'jewellery', 'diffusion', 'pret'].map(pt => (
                  <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.productTypes.includes(pt)}
                      onChange={() => handleCheckboxChange('productTypes', pt)}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{pt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Applies to Genders (Leave all unchecked for 'All')</label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {['womens', 'mens'].map(gender => (
                  <label key={gender} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.genders.includes(gender)}
                      onChange={() => handleCheckboxChange('genders', gender)}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {isEditing ? 'Update' : 'Create'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} style={{ padding: '10px', backgroundColor: '#fff', color: '#000', border: '1px solid #000', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div style={{ flex: 2 }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 20px 0', textTransform: 'capitalize' }}>Existing {activeTab}s</h2>
          {loading ? (
            <p>Loading...</p>
          ) : filteredTaxonomies.length === 0 ? (
            <p style={{ color: '#666' }}>No items found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '10px 5px' }}>Order</th>
                  <th style={{ padding: '10px 5px' }}>Name</th>
                  <th style={{ padding: '10px 5px' }}>Slug</th>
                  <th style={{ padding: '10px 5px' }}>Applies To</th>
                  <th style={{ padding: '10px 5px' }}>Status</th>
                  <th style={{ padding: '10px 5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTaxonomies.map(tax => (
                  <tr key={tax._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 5px' }}>{tax.order}</td>
                    <td style={{ padding: '10px 5px', fontWeight: 'bold' }}>{tax.name}</td>
                    <td style={{ padding: '10px 5px', color: '#666' }}>{tax.slug}</td>
                    <td style={{ padding: '10px 5px', fontSize: '0.8rem' }}>
                      <div style={{ marginBottom: '2px' }}><span style={{ color: '#888' }}>Types:</span> {tax.productTypes?.length ? tax.productTypes.join(', ') : 'All'}</div>
                      <div><span style={{ color: '#888' }}>Genders:</span> {tax.genders?.length ? tax.genders.join(', ') : 'All'}</div>
                    </td>
                    <td style={{ padding: '10px 5px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: tax.enabled ? '#e6f4ea' : '#fce8e6', color: tax.enabled ? '#137333' : '#c5221f' }}>
                        {tax.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 5px', textAlign: 'right' }}>
                      <button onClick={() => handleEdit(tax)} style={{ padding: '4px 8px', marginRight: '5px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px' }}>Edit</button>
                      <button onClick={() => handleDelete(tax._id)} style={{ padding: '4px 8px', cursor: 'pointer', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
