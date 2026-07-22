'use client';

import React, { useState } from 'react';

const customFields = [
  'Apex', 'Under Bust Length', 'Blouse Length',
  'Waist Length', 'Short Top Length', 'Crotch Length',
  'Knee Length', 'Ankle Length', 'Full Length',
  'Above Bust', 'Bust (Chest)', 'Under Bust',
  'Blouse Waist', 'Waist/Lehenga Waist', 'Low Waist',
  'Hip', 'Shoulder', 'Cross Back',
  'Cross Front', 'Cap Sleeves', 'Cap Sleeves Round',
  'Half Sleeves', 'Half Sleeves Round', '3/4 Sleeves',
  '3/4 Sleeves Round', 'Full Sleeves', 'Full Sleeves Round',
  'Bicep', 'Armhole', 'Off Shoulder Round',
  'Round Neck', 'Front Neck Depth', 'Back Neck Depth',
  'Waist to Ankle Length', 'Waist to Full Length + Heels', 'Ankle Round',
  'Calf Round', 'Knee Round', 'Mid Thigh Round',
  'Upper Thigh Round', 'Fork Round'
];

export default function SizeGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'chart' | 'custom'>('chart');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
    setView('chart'); // reset view when opening
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const measurements = {
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    inches: {
      BUST: ['32', '34', '36', '38', '40', '43', '45'],
      WAIST: ['23.5', '26', '28', '29.5', '32', '34.5', '38.5'],
      HIPS: ['34.75', '36.75', '38', '40.5', '42.5', '44.5', '48.5'],
      SHOULDER: ['14.5', '15', '15.5', '16', '16.5', '17.25', '17.75'],
      'ARM HOLE': ['15', '15.5', '16', '16.5', '17.5', '18.5', '19']
    },
    cm: {
      BUST: ['81', '86', '91.5', '96.5', '102', '109', '114'],
      WAIST: ['60', '66', '71', '75', '81', '87.5', '98'],
      HIPS: ['88', '93', '96.5', '103', '108', '113', '123'],
      SHOULDER: ['37', '38', '39', '40.5', '42', '44', '45'],
      'ARM HOLE': ['38', '39', '40.5', '42', '44.5', '47', '48.5']
    }
  };

  return (
    <>
      <button 
        onClick={openModal} 
        style={{ 
          fontSize: '0.85rem', 
          color: '#666', 
          textDecoration: 'underline',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}
      >
        Size Guide
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '2rem'
        }} onClick={closeModal}>
          <div style={{
            backgroundColor: '#fff',
            width: '100%',
            maxWidth: '1000px',
            position: 'relative',
            padding: '3rem 2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxHeight: '95vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                zIndex: 10
              }}
            >
              &times;
            </button>

            {view === 'chart' ? (
              <>
                <h2 style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.15em',
                  fontWeight: 400,
                  marginBottom: '2rem',
                  color: '#333'
                }}>SIZE CHART</h2>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                    color: '#555',
                    marginBottom: '1rem'
                  }}>BODY MEASUREMENTS ({unit.toUpperCase()})</p>

                  <div style={{
                    display: 'inline-flex',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '20px',
                    padding: '0.25rem',
                    gap: '0.25rem'
                  }}>
                    <button
                      onClick={() => setUnit('inches')}
                      style={{
                        padding: '0.4rem 1.5rem',
                        borderRadius: '16px',
                        border: 'none',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: unit === 'inches' ? '#fff' : 'transparent',
                        boxShadow: unit === 'inches' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        color: unit === 'inches' ? '#000' : '#666',
                        transition: 'all 0.2s'
                      }}
                    >
                      INCHES
                    </button>
                    <button
                      onClick={() => setUnit('cm')}
                      style={{
                        padding: '0.4rem 1.5rem',
                        borderRadius: '16px',
                        border: 'none',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: unit === 'cm' ? '#fff' : 'transparent',
                        boxShadow: unit === 'cm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        color: unit === 'cm' ? '#000' : '#666',
                        transition: 'all 0.2s'
                      }}
                    >
                      CM
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    color: '#444'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '1rem', textAlign: 'left', fontWeight: 500, color: '#555' }}>
                          SINGLE SIZE (WOMENSWEAR)
                        </th>
                        {measurements.sizes.map(size => (
                          <th key={size} style={{ border: '1px solid #ddd', padding: '1rem', fontWeight: 500, color: '#555' }}>
                            {size}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.keys(measurements[unit]) as Array<keyof typeof measurements.inches>).map(rowKey => (
                        <tr key={rowKey}>
                          <td style={{ border: '1px solid #ddd', padding: '1rem', textAlign: 'left', fontWeight: 500, color: '#555' }}>
                            {rowKey}
                          </td>
                          {measurements[unit][rowKey].map((val, idx) => (
                            <td key={idx} style={{ border: '1px solid #ddd', padding: '1rem' }}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#444' }}>
                  Want to customise your outfit? <span onClick={() => setView('custom')} style={{ fontWeight: 600, cursor: 'pointer' }}>Click here</span>
                </div>
              </>
            ) : (
              <>
                <h2 style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.15em',
                  fontWeight: 400,
                  marginBottom: '2rem',
                  color: '#333'
                }}>SIZE CHART</h2>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1605282582875-c9ceea5da5be?q=80&w=1470&auto=format&fit=crop" 
                    alt="Taking Measurements" 
                    style={{ maxWidth: '100%', height: '300px', objectFit: 'cover' }} 
                  />
                  <div style={{ marginTop: '1rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    MANISH MALHOTRA
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  {customFields.map(field => (
                    <input 
                      key={field} 
                      type="number" 
                      placeholder={field} 
                      style={{ 
                        padding: '1rem', 
                        border: 'none', 
                        backgroundColor: '#f5f5f5', 
                        width: '100%',
                        outline: 'none',
                        fontSize: '0.9rem',
                        color: '#333',
                        boxSizing: 'border-box'
                      }} 
                    />
                  ))}
                </div>
                
                <textarea 
                  placeholder="Note"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: 'none',
                    backgroundColor: '#f5f5f5',
                    minHeight: '120px',
                    outline: 'none',
                    fontSize: '0.9rem',
                    color: '#333',
                    marginBottom: '2rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => setView('chart')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      backgroundColor: '#fff',
                      color: '#000',
                      border: '1px solid #000',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Back to Chart
                  </button>
                  <button style={{
                    flex: 1,
                    padding: '1rem',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: '1px solid #000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}>
                    Save Custom Sizes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
