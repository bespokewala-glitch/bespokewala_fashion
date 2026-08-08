"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Search,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  X,
  CreditCard,
  MapPin,
  Phone,
  User,
  Package,
  Save,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
} from "lucide-react";
import styles from "./orders.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface ShippingDetails {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface Order {
  _id: string;
  user?: { name: string; email: string } | null;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed";
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  processing: { label: "Processing", color: "#b45309", bg: "#fef3c7", icon: Clock },
  shipped:    { label: "Shipped",    color: "#1d4ed8", bg: "#dbeafe", icon: Truck },
  delivered:  { label: "Delivered",  color: "#15803d", bg: "#dcfce7", icon: CheckCircle },
  cancelled:  { label: "Cancelled",  color: "#dc2626", bg: "#fee2e2", icon: XCircle },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: "Paid",    color: "#15803d", bg: "#dcfce7" },
  pending:   { label: "Pending", color: "#b45309", bg: "#fef3c7" },
  failed:    { label: "Failed",  color: "#dc2626", bg: "#fee2e2" },
};

const FILTERS = [
  { key: "all",        label: "All" },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Delivered" },
  { key: "cancelled",  label: "Cancelled" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6", icon: Clock };
  const Ic = cfg.icon;
  return (
    <span className={styles.statusPill} style={{ color: cfg.color, background: cfg.bg }}>
      <Ic size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Order Detail Drawer ─────────────────────────────────────────────────────
function OrderDrawer({
  order,
  onClose,
  onStatusUpdate,
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
}) {
  const [newStatus, setNewStatus] = useState(order.orderStatus);
  const [saving, setSaving] = useState(false);

  const sd = order.shippingDetails;
  const customerName =
    order.user?.name ||
    `${sd?.firstName ?? ""} ${sd?.lastName ?? ""}`.trim() ||
    "Guest";

  const paymentCfg = PAYMENT_CONFIG[order.paymentStatus] ?? PAYMENT_CONFIG.pending;

  const handleSave = async () => {
    if (newStatus === order.orderStatus) return;
    setSaving(true);
    await onStatusUpdate(order._id, newStatus);
    setSaving(false);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.drawerTitle}>
              Order #{order._id.slice(-8).toUpperCase()}
            </p>
            <p className={styles.drawerSubtitle}>
              {new Date(order.createdAt).toLocaleString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <button className={styles.drawerCloseBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody}>
          {/* Status control */}
          <div className={styles.statusRow}>
            <div>
              <div className={styles.statusRowLabel}>Order Status</div>
              <StatusPill status={order.orderStatus} />
            </div>
            <select
              className={styles.drawerStatusSelect}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as Order["orderStatus"])}
            >
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Customer */}
          <div className={styles.drawerSection}>
            <p className={styles.drawerSectionTitle}>
              <User size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Customer
            </p>
            <div className={styles.drawerGrid}>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>Name</span>
                <span className={styles.drawerFieldValue}>{customerName}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>Email</span>
                <span className={styles.drawerFieldValue} style={{ wordBreak: "break-all" }}>
                  {order.user?.email || "—"}
                </span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>
                  <Phone size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
                  Phone
                </span>
                <span className={styles.drawerFieldValue}>{sd?.phone || "—"}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>
                  <CreditCard size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
                  Payment
                </span>
                <span>
                  <span className={styles.payBadge} style={{ color: paymentCfg.color, background: paymentCfg.bg }}>
                    {paymentCfg.label}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: 6 }}>
                    {order.paymentMethod}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className={styles.drawerSection}>
            <p className={styles.drawerSectionTitle}>
              <MapPin size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Shipping Address
            </p>
            <div className={styles.drawerGrid}>
              <div className={`${styles.drawerField} ${styles.drawerFieldFull}`}>
                <span className={styles.drawerFieldLabel}>Street</span>
                <span className={styles.drawerFieldValue}>{sd?.address || "—"}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>City</span>
                <span className={styles.drawerFieldValue}>{sd?.city || "—"}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>State</span>
                <span className={styles.drawerFieldValue}>{sd?.state || "—"}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>ZIP Code</span>
                <span className={styles.drawerFieldValue}>{sd?.zipCode || "—"}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerFieldLabel}>Country</span>
                <span className={styles.drawerFieldValue}>{sd?.country || "—"}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className={styles.drawerSection}>
            <p className={styles.drawerSectionTitle}>
              <Package size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Items ({order.items?.length ?? 0})
            </p>
            <div className={styles.itemsList}>
              {(order.items ?? []).map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className={styles.itemImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className={styles.itemImgPlaceholder}>
                      <Package size={18} />
                    </div>
                  )}
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemMeta}>
                      Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ""}
                    </div>
                  </div>
                  <div className={styles.itemPrice}>{fmt(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className={styles.totalsBox}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Shipping</span>
              <span>{order.shippingCost === 0 ? "Free" : fmt(order.shippingCost)}</span>
            </div>
            <div className={styles.totalRowBold}>
              <span>Total</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button
            className={styles.btnSaveStatus}
            onClick={handleSave}
            disabled={saving || newStatus === order.orderStatus}
          >
            {saving ? (
              <span className={styles.saving}>Saving…</span>
            ) : (
              <>
                <Save size={14} />
                Update Status
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  const Ic = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div className={`${styles.toast} ${type === "success" ? styles.toastSuccess : styles.toastError}`}>
      <Ic size={16} />
      {message}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success) setAllOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: allOrders.length,
    processing: allOrders.filter(o => o.orderStatus === "processing").length,
    shipped: allOrders.filter(o => o.orderStatus === "shipped").length,
    delivered: allOrders.filter(o => o.orderStatus === "delivered").length,
    cancelled: allOrders.filter(o => o.orderStatus === "cancelled").length,
    revenue: allOrders.filter(o => o.paymentStatus === "completed").reduce((s, o) => s + o.total, 0),
  }), [allOrders]);

  const filtered = useMemo(() => {
    let list = [...allOrders];
    if (filter !== "all") list = list.filter(o => o.orderStatus === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o._id.toLowerCase().includes(q) ||
        (o.user?.name ?? "").toLowerCase().includes(q) ||
        (o.user?.email ?? "").toLowerCase().includes(q) ||
        `${o.shippingDetails?.firstName ?? ""} ${o.shippingDetails?.lastName ?? ""}`.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "highest") return b.total - a.total;
      if (sort === "lowest") return a.total - b.total;
      return 0;
    });
    return list;
  }, [allOrders, filter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search, sort]);

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAllOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus as Order["orderStatus"] } : o));
        setSelectedOrder(prev => prev?._id === orderId ? { ...prev, orderStatus: newStatus as Order["orderStatus"] } : prev);
        setToast({ message: "Order status updated successfully", type: "success" });
      } else {
        setToast({ message: data.error || "Failed to update status", type: "error" });
      }
    } catch {
      setToast({ message: "Network error. Please try again.", type: "error" });
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading orders…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Orders</h1>
          <p>{allOrders.length} total orders · {fmt(stats.revenue)} revenue</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={fetchOrders}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className={styles.statsRow}>
        {[
          { label: "All Orders",  value: stats.total,      icon: ShoppingBag, color: "#7c3aed", bg: "#ede9fe" },
          { label: "Processing",  value: stats.processing,  icon: Clock,       color: "#b45309", bg: "#fef3c7" },
          { label: "Shipped",     value: stats.shipped,     icon: Truck,       color: "#1d4ed8", bg: "#dbeafe" },
          { label: "Delivered",   value: stats.delivered,   icon: CheckCircle, color: "#15803d", bg: "#dcfce7" },
        ].map((s) => {
          const Ic = s.icon;
          return (
            <div
              key={s.label}
              className={styles.statCard}
              style={{ cursor: "pointer" }}
              onClick={() => setFilter(s.label === "All Orders" ? "all" : s.label.toLowerCase())}
            >
              <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
                <Ic size={18} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by order ID, name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ShoppingBag size={28} color="#9ca3af" />
            </div>
            <h3>No orders found</h3>
            <p>
              {search ? `No results for "${search}"` : `No orders with status "${filter}"`}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Update</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(order => {
                    const customerName =
                      order.user?.name ||
                      `${order.shippingDetails?.firstName ?? ""} ${order.shippingDetails?.lastName ?? ""}`.trim() ||
                      "Guest";
                    const initials = customerName.charAt(0).toUpperCase();
                    const itemSummary =
                      order.items?.length > 0
                        ? order.items[0].name
                        : "—";
                    const payCfg = PAYMENT_CONFIG[order.paymentStatus] ?? PAYMENT_CONFIG.pending;

                    return (
                      <tr key={order._id} onClick={() => setSelectedOrder(order)}>
                        <td>
                          <span className={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            <div className={styles.avatar}>{initials}</div>
                            <div>
                              <div className={styles.customerName}>{customerName}</div>
                              {order.user?.email && (
                                <div className={styles.customerEmail}>{order.user.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.itemsSummary}>{itemSummary}</div>
                          {order.items?.length > 1 && (
                            <div className={styles.itemCount}>+{order.items.length - 1} more item{order.items.length > 2 ? "s" : ""}</div>
                          )}
                        </td>
                        <td>
                          <span className={styles.amount}>{fmt(order.total)}</span>
                        </td>
                        <td>
                          <span className={styles.payBadge} style={{ color: payCfg.color, background: payCfg.bg }}>
                            {payCfg.label}
                          </span>
                        </td>
                        <td>
                          <StatusPill status={order.orderStatus} />
                        </td>
                        <td>
                          <div className={styles.dateCell}>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </div>
                          <div className={styles.dateTime}>
                            {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className={styles.statusSelect}
                            value={order.orderStatus}
                            onChange={e => handleStatusUpdate(order._id, e.target.value)}
                            style={{
                              background:
                                order.orderStatus === "delivered" ? "#dcfce7"
                                : order.orderStatus === "cancelled" ? "#fee2e2"
                                : order.orderStatus === "shipped" ? "#dbeafe"
                                : "#fef3c7",
                            }}
                          >
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye size={13} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer / Pagination */}
            <div className={styles.tableFooter}>
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} orders
              </span>
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Order Detail Drawer ── */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
