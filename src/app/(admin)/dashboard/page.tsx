"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  BarChart2,
  Star,
} from "lucide-react";
import styles from "./dashboard.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DayData {
  _id: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  _id: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

interface RecentOrder {
  _id: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  user?: { name: string; email: string } | null;
  shippingDetails: { firstName: string; lastName: string };
  items: { name: string; quantity: number }[];
}

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalUsers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    inventoryCount: number;
    images?: string[];
    productType?: string;
    category?: string;
  }[];
  thisMonthRevenue: number;
  revenueGrowth: number;
  thisMonthOrders: number;
  ordersGrowth: number;
  newUsersThisMonth: number;
  usersGrowth: number;
  ordersByStatus: Record<string, number>;
  recentOrders: RecentOrder[];
  last7DaysOrders: DayData[];
  topProducts: TopProduct[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  confirmed: { label: "Confirmed", color: "#16a34a", bg: "#dcfce7", icon: CheckCircle },
  production: { label: "In Production", color: "#d97706", bg: "#fef3c7", icon: Clock },
  qc: { label: "Quality Check", color: "#7c3aed", bg: "#ede9fe", icon: Star },
  dispatched: { label: "Dispatched", color: "#2563eb", bg: "#dbeafe", icon: Truck },
  in_transit: { label: "In Transit", color: "#0891b2", bg: "#cffafe", icon: Truck },
  delivered: { label: "Delivered", color: "#15803d", bg: "#dcfce7", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2", icon: XCircle },
  processing: { label: "Processing", color: "#b45309", bg: "#fef3c7", icon: Clock },
  shipped: { label: "Shipped", color: "#1d4ed8", bg: "#dbeafe", icon: Truck },
};

// ─── Mini sparkline (pure SVG, no library) ────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 120;
  const H = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });
  const area = `M${pts[0]} L${pts.join(" L")} L${W},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${color})`} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Bar chart (7-day revenue) ────────────────────────────────────────────────
function BarChart({ data }: { data: DayData[] }) {
  if (!data.length)
    return (
      <div className={styles.emptyChart}>No revenue data for the last 7 days</div>
    );
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className={styles.barChart}>
      {data.map((d) => {
        const date = new Date(d._id + "T00:00:00");
        const label = dayLabels[date.getDay()];
        const pct = (d.revenue / max) * 100;
        return (
          <div key={d._id} className={styles.barCol}>
            <div className={styles.barTooltip}>
              <strong>{fmt(d.revenue)}</strong>
              <span>{d.orders} order{d.orders !== 1 ? "s" : ""}</span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className={styles.barLabel}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  subtitle,
  growth,
  icon: Icon,
  iconColor,
  iconBg,
  sparkData,
  sparkColor,
  href,
}: {
  title: string;
  value: string;
  subtitle: string;
  growth: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sparkData: number[];
  sparkColor: string;
  href: string;
}) {
  const positive = growth >= 0;
  return (
    <Link href={href} className={styles.kpiCard}>
      <div className={styles.kpiTop}>
        <div className={styles.kpiIcon} style={{ background: iconBg, color: iconColor }}>
          <Icon size={20} />
        </div>
        <div
          className={styles.kpiBadge}
          style={{
            color: positive ? "#15803d" : "#dc2626",
            background: positive ? "#dcfce7" : "#fee2e2",
          }}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(growth)}%
        </div>
      </div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiTitle}>{title}</div>
      <div className={styles.kpiSubtitle}>{subtitle}</div>
      <div className={styles.kpiSpark}>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
    </Link>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: Clock,
  };
  const Ic = cfg.icon;
  return (
    <span
      className={styles.statusPill}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Ic size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Donut chart (order status) ───────────────────────────────────────────────
function DonutChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const items = [
    { key: "confirmed", label: "Confirmed", color: "#16a34a" },
    { key: "production", label: "Production", color: "#d97706" },
    { key: "qc", label: "QC", color: "#7c3aed" },
    { key: "dispatched", label: "Dispatched", color: "#2563eb" },
    { key: "in_transit", label: "In Transit", color: "#0891b2" },
    { key: "delivered", label: "Delivered", color: "#22c55e" },
    { key: "cancelled", label: "Cancelled", color: "#ef4444" },
  ] as const;

  const total = items.reduce((s, i) => s + (data[i.key] ?? 0), 0) || 1;
  const R = 54;
  const cx = 70;
  const cy = 70;
  let cumAngle = -90;

  const slices = items.map((item) => {
    const val = data[item.key] ?? 0;
    const angle = (val / total) * 360;
    const startA = cumAngle;
    cumAngle += angle;
    return { ...item, val, angle, startA };
  });

  function arc(startDeg: number, endDeg: number, r: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const lg = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`;
  }

  return (
    <div className={styles.donutWrap}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {slices.map((s) =>
          s.val === 0 ? null : (
            <path
              key={s.key}
              d={arc(s.startA, s.startA + s.angle, R)}
              fill={s.color}
              stroke="#fff"
              strokeWidth="2"
            />
          )
        )}
        <circle cx={cx} cy={cy} r={34} fill="#fff" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="#111">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#888">
          orders
        </text>
      </svg>
      <div className={styles.donutLegend}>
        {slices.map((s) => (
          <div key={s.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendVal}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error("Failed to fetch stats", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const revenueSpark = stats?.last7DaysOrders.map((d) => d.revenue) ?? [];
  const ordersSpark = stats?.last7DaysOrders.map((d) => d.orders) ?? [];

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Welcome back, Admin
              {lastUpdated && (
                <span className={styles.lastUpdated}>
                  · Last updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={fetchStats}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="Total Revenue"
          value={fmt(stats?.totalRevenue ?? 0)}
          subtitle={`${fmt(stats?.thisMonthRevenue ?? 0)} this month`}
          growth={stats?.revenueGrowth ?? 0}
          icon={DollarSign}
          iconColor="#7c3aed"
          iconBg="#ede9fe"
          sparkData={revenueSpark}
          sparkColor="#7c3aed"
          href="/dashboard/orders"
        />
        <KpiCard
          title="Total Orders"
          value={(stats?.totalOrders ?? 0).toLocaleString()}
          subtitle={`${stats?.thisMonthOrders ?? 0} this month`}
          growth={stats?.ordersGrowth ?? 0}
          icon={ShoppingBag}
          iconColor="#0369a1"
          iconBg="#e0f2fe"
          sparkData={ordersSpark}
          sparkColor="#0369a1"
          href="/dashboard/orders"
        />
        <KpiCard
          title="Customers"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          subtitle={`${stats?.newUsersThisMonth ?? 0} new this month`}
          growth={stats?.usersGrowth ?? 0}
          icon={Users}
          iconColor="#0f766e"
          iconBg="#ccfbf1"
          sparkData={[]}
          sparkColor="#0f766e"
          href="/dashboard/users"
        />
        <KpiCard
          title="Products"
          value={(stats?.totalProducts ?? 0).toLocaleString()}
          subtitle="In catalog"
          growth={0}
          icon={Package}
          iconColor="#b45309"
          iconBg="#fef3c7"
          sparkData={[]}
          sparkColor="#b45309"
          href="/dashboard/products"
        />
      </div>

      {/* ── Business Health Strip: Paid, Pending, Failed & Stock ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid Orders</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>{(stats?.paidOrders ?? 0).toLocaleString()}</div>
          </div>
          <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>Completed</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Payment</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>{(stats?.pendingOrders ?? 0).toLocaleString()}</div>
          </div>
          <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>Action Pending</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Failed Payment</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#dc2626', marginTop: '2px' }}>{(stats?.failedOrders ?? 0).toLocaleString()}</div>
          </div>
          <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>Attention</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock Alert</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: (stats?.lowStockCount ?? 0) > 0 ? '#ea580c' : '#16a34a', marginTop: '2px' }}>
              {(stats?.lowStockCount ?? 0).toLocaleString()} items
            </div>
          </div>
          <Link href="/dashboard/inventory" style={{ textDecoration: 'none', background: (stats?.lowStockCount ?? 0) > 0 ? '#ffedd5' : '#f1f5f9', color: (stats?.lowStockCount ?? 0) > 0 ? '#c2410c' : '#475569', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
            {(stats?.lowStockCount ?? 0) > 0 ? 'Restock' : 'Healthy'}
          </Link>
        </div>
      </div>

      {/* ── Low Stock Alert Banner & Quick Table (if any) ── */}
      {Boolean(stats?.lowStockCount && stats.lowStockCount > 0) && (
        <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#9a3412' }}>
                  Low Stock Warning ({stats?.lowStockCount} products have 5 or fewer items remaining)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#c2410c' }}>
                  Restock these items to prevent checkout abandonment.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/inventory"
              style={{
                textDecoration: 'none',
                background: '#ea580c',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: '6px'
              }}
            >
              Open Inventory Manager
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #fed7aa', color: '#9a3412', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Product</th>
                  <th style={{ padding: '8px 12px' }}>Category</th>
                  <th style={{ padding: '8px 12px' }}>Price</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Stock Left</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowStockProducts.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #ffedd5' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{p.name}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', textTransform: 'capitalize' }}>{p.category || p.productType}</td>
                    <td style={{ padding: '10px 12px', color: '#1e293b' }}>{fmt(p.price)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        background: p.inventoryCount === 0 ? '#fee2e2' : '#ffedd5',
                        color: p.inventoryCount === 0 ? '#dc2626' : '#ea580c'
                      }}>
                        {p.inventoryCount === 0 ? 'Out of Stock' : `${p.inventoryCount} left`}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <Link
                        href={`/dashboard/products?search=${encodeURIComponent(p.name)}`}
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        Edit Stock →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className={`${styles.chartsRow} mobile-flex-col`}>
        {/* Revenue Bar Chart */}
        <div className={styles.card} style={{ flex: 2 }}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>
                <BarChart2 size={17} style={{ verticalAlign: "middle", marginRight: 6 }} />
                Revenue — Last 7 Days
              </h2>
              <p className={styles.cardSubtitle}>Daily revenue breakdown</p>
            </div>
          </div>
          <BarChart data={stats?.last7DaysOrders ?? []} />
        </div>

        {/* Order Status Donut */}
        <div className={styles.card} style={{ flex: 1 }}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Order Status</h2>
              <p className={styles.cardSubtitle}>All-time distribution</p>
            </div>
          </div>
          <DonutChart
            data={
              stats?.ordersByStatus ?? {
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
              }
            }
          />
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className={`${styles.bottomRow} mobile-flex-col`}>
        {/* Recent Orders */}
        <div className={styles.card} style={{ flex: 2 }}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Recent Orders</h2>
              <p className={styles.cardSubtitle}>Latest 8 transactions</p>
            </div>
            <Link href="/dashboard/orders" className={styles.viewAllBtn}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className={`${styles.tableWrap} table-responsive-wrapper`}>
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
                </tr>
              </thead>
              <tbody>
                {(stats?.recentOrders ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyRow}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  (stats?.recentOrders ?? []).map((order) => {
                    const customerName =
                      order.user?.name ||
                      `${order.shippingDetails?.firstName ?? ""} ${order.shippingDetails?.lastName ?? ""}`.trim() ||
                      "Guest";
                    const itemSummary =
                      order.items?.length > 0
                        ? order.items.length === 1
                          ? order.items[0].name
                          : `${order.items[0].name} +${order.items.length - 1} more`
                        : "—";
                    return (
                      <tr key={order._id}>
                        <td>
                          <span className={styles.orderId}>
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            <div className={styles.avatar}>
                              {customerName.charAt(0).toUpperCase()}
                            </div>
                            <span>{customerName}</span>
                          </div>
                        </td>
                        <td className={styles.itemName}>{itemSummary}</td>
                        <td className={styles.amount}>{fmt(order.total)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: order.paymentStatus === 'completed' ? '#dcfce7' : order.paymentStatus === 'failed' ? '#fee2e2' : '#fef3c7',
                            color: order.paymentStatus === 'completed' ? '#15803d' : order.paymentStatus === 'failed' ? '#b91c1c' : '#b45309'
                          }}>
                            {order.paymentStatus === 'completed' ? 'Paid' : order.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <StatusPill status={order.orderStatus} />
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className={styles.card} style={{ flex: 1 }}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>
                <Star size={15} style={{ verticalAlign: "middle", marginRight: 6, color: "#f59e0b" }} />
                Top Products
              </h2>
              <p className={styles.cardSubtitle}>By revenue generated</p>
            </div>
            <Link href="/dashboard/products" className={styles.viewAllBtn}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.topProductsList}>
            {(stats?.topProducts ?? []).length === 0 ? (
              <p className={styles.emptyChart}>No sales data yet</p>
            ) : (
              (stats?.topProducts ?? []).map((p, idx) => {
                const maxRev = stats!.topProducts[0].revenue || 1;
                const pct = (p.revenue / maxRev) * 100;
                return (
                  <div key={p._id} className={styles.topProductItem}>
                    <div className={styles.tpRank}>#{idx + 1}</div>
                    <div className={styles.tpInfo}>
                      <div className={styles.tpName}>{p.name}</div>
                      <div className={styles.tpBar}>
                        <div
                          className={styles.tpBarFill}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className={styles.tpMeta}>
                        <span>{fmt(p.revenue)}</span>
                        <span>{p.unitsSold} sold</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          {[
            { href: "/dashboard/orders", icon: ShoppingBag, label: "Manage Orders", desc: "Update statuses & track shipments", color: "#0369a1", bg: "#e0f2fe" },
            { href: "/dashboard/products", icon: Package, label: "Manage Products", desc: "Add, edit or remove items", color: "#7c3aed", bg: "#ede9fe" },
            { href: "/dashboard/users", icon: Users, label: "View Customers", desc: "Browse registered accounts", color: "#0f766e", bg: "#ccfbf1" },
            { href: "/dashboard/campaigns", icon: BarChart2, label: "Campaigns", desc: "Manage banners & hero media", color: "#b45309", bg: "#fef3c7" },
            { href: "/dashboard/homepage", icon: Star, label: "Homepage Sections", desc: "Edit storefront layout", color: "#be185d", bg: "#fce7f3" },
          ].map((action) => {
            const Ic = action.icon;
            return (
              <Link key={action.href} href={action.href} className={styles.actionCard}>
                <div
                  className={styles.actionIcon}
                  style={{ color: action.color, background: action.bg }}
                >
                  <Ic size={22} />
                </div>
                <div>
                  <div className={styles.actionLabel}>{action.label}</div>
                  <div className={styles.actionDesc}>{action.desc}</div>
                </div>
                <ArrowRight size={16} className={styles.actionArrow} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
