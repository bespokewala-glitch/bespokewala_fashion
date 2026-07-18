"use client";

import React, { useState, useEffect } from 'react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o._id === orderId ? data.order : o));
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      alert('Error updating status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Orders</h1>
      </div>

      {loading ? <p>Loading orders...</p> : orders.length === 0 ? <p>No orders found.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ padding: '15px' }}>Order ID</th>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Customer</th>
                <th style={{ padding: '15px' }}>Amount</th>
                <th style={{ padding: '15px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', fontFamily: 'monospace' }}>{order._id.substring(order._id.length - 8)}</td>
                  <td style={{ padding: '15px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '15px' }}>
                    {order.user?.name || 'Guest'}<br/>
                    <small style={{ color: '#666' }}>{order.user?.email || ''}</small>
                  </td>
                  <td style={{ padding: '15px' }}>${order.totalAmount.toFixed(2)}</td>
                  <td style={{ padding: '15px' }}>
                    <select 
                      value={order.status} 
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={updating === order._id}
                      style={{ 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc',
                        backgroundColor: order.status === 'Delivered' ? '#e6fffa' : 
                                       order.status === 'Cancelled' ? '#fff5f5' : '#fff'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    {updating === order._id && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>Saving...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
