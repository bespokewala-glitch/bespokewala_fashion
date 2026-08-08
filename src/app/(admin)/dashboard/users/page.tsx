"use client";

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './users.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (user.name && user.name.toLowerCase().includes(query)) || 
           (user.email && user.email.toLowerCase().includes(query));
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        <p className={styles.summary}>{users.length} registered users</p>
      </div>

      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search users by name or email" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? <p>Loading users...</p> : filteredUsers.length === 0 ? <p>No users found.</p> : (
        <>
          {/* DESKTOP TABLE */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.roleAdmin : styles.roleCustomer}`}>
                        {user.role || 'customer'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className={styles.mobileList}>
            {filteredUsers.map((user) => (
              <div key={user._id} className={styles.userCard}>
                <div className={styles.avatar}>
                  {getInitials(user.name)}
                </div>
                <div className={styles.userInfo}>
                  <h3 className={styles.userName}>{user.name}</h3>
                  <p className={styles.userEmail}>{user.email}</p>
                  <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.roleAdmin : styles.roleCustomer}`}>
                    {user.role || 'customer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
