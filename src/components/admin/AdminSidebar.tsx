"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Image as ImageIcon, 
  LayoutTemplate, 
  LogOut,
  ListTree,
  Tags,
  Calendar,
  Layers
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentProductType = searchParams.get('productType');
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    '/dashboard/products': pathname.startsWith('/dashboard/products')
  });

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { 
      name: 'Products', 
      path: '/dashboard/products', 
      icon: Package,
      subItems: [
        { name: 'Couture', productType: 'couture' },
        { name: 'Jewellery', productType: 'jewellery' },
        { name: 'Accessories', productType: 'accessories' },
      ]
    },
    { name: 'Users', path: '/dashboard/users', icon: Users },
    { name: 'Campaigns', path: '/dashboard/campaigns', icon: ImageIcon },
    { name: 'Homepage Sections', path: '/dashboard/homepage', icon: LayoutTemplate },
  ];

  return (
    <div style={{ 
      width: '260px', 
      backgroundColor: '#111', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '30px 20px', borderBottom: '1px solid #333' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.05em' }}>BESPOKEN</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>Admin Portal</p>
      </div>

      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          if (item.subItems) {
            return (
              <div key={item.path}>
                <button 
                  onClick={() => toggleExpand(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 15px',
                    backgroundColor: 'transparent',
                    color: '#aaa',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    fontWeight: 400
                  }}
                >
                  <Icon size={18} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <span style={{ fontSize: '0.8rem' }}>{expandedItems[item.path] ? '▼' : '▶'}</span>
                </button>
                
                {expandedItems[item.path] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginLeft: '30px', marginTop: '5px' }}>
                    {item.subItems?.map((subItem: any) => {
                      const isSubActive = pathname === item.path && currentProductType === subItem.productType;
                      return (
                        <Link 
                          key={subItem.productType} 
                          href={`${item.path}?productType=${subItem.productType}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 10px',
                            color: isSubActive ? '#fff' : '#888',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem',
                            fontWeight: isSubActive ? 600 : 400,
                            backgroundColor: isSubActive ? '#222' : 'transparent'
                          }}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link 
              key={item.path} 
              href={item.path} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 15px',
                backgroundColor: isActive && !currentProductType ? '#333' : 'transparent',
                color: isActive && !currentProductType ? '#fff' : '#aaa',
                textDecoration: 'none',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                fontWeight: isActive && !currentProductType ? 600 : 400
              }}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
        <Link 
          href="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: '#ff4d4f',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            fontWeight: 600,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <LogOut size={18} />
          Return to Store
        </Link>
      </div>
    </div>
  );
}
