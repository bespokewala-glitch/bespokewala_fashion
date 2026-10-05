"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  Shield,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Ban,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface CustomerAddress {
  _id?: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

interface CustomerUser {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  role: "admin" | "customer";
  status?: "active" | "suspended";
  provider?: string;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  addresses?: CustomerAddress[];
}

interface CustomerOrder {
  _id: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  items: { name: string; quantity: number; price: number }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "admin" | "suspended">("all");

  // Customer Profile Drawer State
  const [selectedUser, setSelectedUser] = useState<CustomerUser | null>(null);
  const [userOrders, setUserOrders] = useState<CustomerOrder[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (roleFilter === "customer" || roleFilter === "admin") {
        params.set("role", roleFilter);
      } else if (roleFilter === "suspended") {
        params.set("status", "suspended");
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const openProfile = async (user: CustomerUser) => {
    setSelectedUser(user);
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data.user);
        setUserOrders(data.orders || []);
      }
    } catch (e: any) {
      showToast(e.message || "Could not load full profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const toggleAccountStatus = async (user: CustomerUser) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    const confirmMsg =
      newStatus === "suspended"
        ? `Are you sure you want to suspend "${user.name}"? They will not be able to log in.`
        : `Reactivate account for "${user.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
        );
        if (selectedUser && selectedUser._id === user._id) {
          setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(`Account status updated to ${newStatus}`, "success");
      } else {
        showToast(data.error || "Failed to update account", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Network error", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleUserRole = async (user: CustomerUser) => {
    const newRole = user.role === "admin" ? "customer" : "admin";
    const confirmMsg =
      newRole === "admin"
        ? `Grant Admin access to "${user.name}"? They will have full dashboard control.`
        : `Remove Admin privileges from "${user.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
        );
        if (selectedUser && selectedUser._id === user._id) {
          setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
        }
        showToast(`User role changed to ${newRole}`, "success");
      } else {
        showToast(data.error || "Failed to update role", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Network error", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  // Summary counts
  const totalCustomers = users.filter((u) => u.role !== "admin").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalSuspended = users.filter((u) => u.status === "suspended").length;

  return (
    <div style={{ padding: "32px 36px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
            zIndex: 9999,
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "26px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={24} style={{ color: "#c8a96e" }} />
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Customer & User Management
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            View profiles, order history, contact details, and account security restrictions. Passwords are never exposed.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            color: "#334155",
            fontSize: "0.84rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Registered Customers</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>{totalCustomers}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Admin Operators</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#7c3aed", marginTop: "4px" }}>{totalAdmins}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Restricted Accounts</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: totalSuspended > 0 ? "#dc2626" : "#16a34a", marginTop: "4px" }}>
            {totalSuspended}
          </div>
        </div>
      </div>

      {/* Search & Role Filters */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search by customer name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#1e293b",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {[
            { key: "all", label: "All Users" },
            { key: "customer", label: "Customers" },
            { key: "admin", label: "Admins" },
            { key: "suspended", label: "Suspended" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setRoleFilter(btn.key as any)}
              style={{
                padding: "7px 12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: roleFilter === btn.key ? "#0f172a" : "#f1f5f9",
                color: roleFilter === btn.key ? "#fff" : "#475569",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: "12px", display: "inline-block" }} />
            <div>Loading customer database...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <Users size={36} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#334155" }}>No matching accounts found</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                  <th style={{ padding: "12px 18px" }}>Customer</th>
                  <th style={{ padding: "12px 18px" }}>Contact</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Role</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Orders</th>
                  <th style={{ padding: "12px 18px" }}>Total Spent</th>
                  <th style={{ padding: "12px 18px" }}>Joined</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: u.role === "admin" ? "#ede9fe" : "#f1f5f9",
                            color: u.role === "admin" ? "#7c3aed" : "#334155",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                          }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{u.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            {u.provider === "google" ? "Google Account" : "Email & Password"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ color: "#334155", fontSize: "0.84rem" }}>{u.email}</div>
                      {u.mobileNumber && (
                        <div style={{ color: "#64748b", fontSize: "0.76rem", marginTop: "2px" }}>
                          📞 {u.mobileNumber}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 18px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: u.role === "admin" ? "#ede9fe" : "#f1f5f9",
                          color: u.role === "admin" ? "#7c3aed" : "#475569",
                        }}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: "12px 18px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: u.status === "suspended" ? "#fee2e2" : "#dcfce7",
                          color: u.status === "suspended" ? "#dc2626" : "#15803d",
                        }}
                      >
                        {u.status === "suspended" ? "Suspended" : "Active"}
                      </span>
                    </td>

                    <td style={{ padding: "12px 18px", textAlign: "center", fontWeight: 600, color: "#334155" }}>
                      {u.orderCount ?? 0}
                    </td>

                    <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>
                      ₹{(u.totalSpent ?? 0).toLocaleString("en-IN")}
                    </td>

                    <td style={{ padding: "12px 18px", color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td style={{ padding: "12px 18px", textAlign: "right" }}>
                      <button
                        onClick={() => openProfile(u)}
                        style={{
                          padding: "6px 12px",
                          background: "#0f172a",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Profile & History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Drawer Modal */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 900,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              height: "100%",
              background: "#fff",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
              overflowY: "auto",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: selectedUser.role === "admin" ? "#ede9fe" : "#f8f5f0",
                    color: selectedUser.role === "admin" ? "#7c3aed" : "#c8a96e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {getInitials(selectedUser.name)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                    {selectedUser.name}
                  </h2>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                    Customer ID: {selectedUser._id}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingProfile ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={22} className="spin" />
                <p>Loading profile details...</p>
              </div>
            ) : (
              <>
                {/* Contact & Account Security Strip */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "12px" }}>
                    Account & Contact Details
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                      <Mail size={15} color="#64748b" /> {selectedUser.email}
                    </div>
                    {selectedUser.mobileNumber && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                        <Phone size={15} color="#64748b" /> {selectedUser.mobileNumber}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.8rem" }}>
                      <Calendar size={14} /> Joined {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                    </div>
                  </div>

                  {/* Actions / Restriction Controls */}
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => toggleAccountStatus(selectedUser)}
                      disabled={updatingStatus}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        border: "1px solid #cbd5e1",
                        background: selectedUser.status === "suspended" ? "#dcfce7" : "#fee2e2",
                        color: selectedUser.status === "suspended" ? "#15803d" : "#dc2626",
                        cursor: "pointer",
                      }}
                    >
                      {selectedUser.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
                    </button>

                    <button
                      onClick={() => toggleUserRole(selectedUser)}
                      disabled={updatingStatus}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: selectedUser.role === "admin" ? "#dc2626" : "#7c3aed",
                        cursor: "pointer",
                      }}
                    >
                      {selectedUser.role === "admin" ? "Demote to Customer" : "Promote to Admin"}
                    </button>
                  </div>
                </div>

                {/* Address Book */}
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                    Saved Shipping Addresses
                  </h3>
                  {!selectedUser.addresses || selectedUser.addresses.length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No saved addresses on file.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {selectedUser.addresses.map((a, idx) => (
                        <div key={idx} style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "8px", padding: "12px 14px", fontSize: "0.82rem", lineHeight: 1.6, color: "#495057" }}>
                          <div style={{ fontWeight: 600, color: "#212529" }}>
                            {a.firstName} {a.lastName} {a.isDefault && <span style={{ fontSize: "0.7rem", color: "#16a34a" }}>(Default)</span>}
                          </div>
                          <div>{a.address}</div>
                          <div>{a.city}, {a.state} {a.zipCode}</div>
                          <div>📞 {a.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order History */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      Order History ({userOrders.length})
                    </h3>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a" }}>
                      Total Spend: ₹{(selectedUser.totalSpent ?? 0).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {userOrders.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", color: "#94a3b8", fontSize: "0.85rem" }}>
                      This customer has not placed any orders yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {userOrders.map((o) => (
                        <div
                          key={o._id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "12px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.82rem",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                              Order #{o._id.slice(-8).toUpperCase()}
                            </div>
                            <div style={{ color: "#64748b", marginTop: "2px" }}>
                              {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {o.items?.length || 0} items
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              ₹{o.total.toLocaleString("en-IN")}
                            </div>
                            <div style={{ marginTop: "2px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  background: o.paymentStatus === "completed" ? "#dcfce7" : "#fee2e2",
                                  color: o.paymentStatus === "completed" ? "#15803d" : "#dc2626",
                                }}
                              >
                                {o.paymentStatus === "completed" ? "Paid" : o.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
