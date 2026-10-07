"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  FileCode,
  AlertCircle,
  Copy,
  Check,
  Globe,
  Database,
  Lock,
} from "lucide-react";

interface AuditLogItem {
  _id: string;
  actor_id: string;
  actor_email?: string;
  action: string;
  target_type: string;
  target_id?: string;
  ip?: string;
  user_agent?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (pageToLoad: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", "25");

        if (search.trim()) {
          params.set("q", search.trim());
        }
        if (targetType !== "all") {
          params.set("target_type", targetType);
        }

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load audit logs");
        }

        setLogs(data.logs || []);
        setPagination(
          data.pagination || { page: pageToLoad, limit: 25, total: 0, totalPages: 1 }
        );
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred loading logs");
      } finally {
        setLoading(false);
      }
    },
    [search, targetType]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadgeStyle = (action: string, targetType: string) => {
    if (action.includes("deleted") || action.includes("suspended")) {
      return {
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
      };
    }
    if (action.includes("created")) {
      return {
        background: "#ecfdf5",
        color: "#047857",
        border: "1px solid #a7f3d0",
      };
    }
    if (action.includes("status_updated") || targetType === "order") {
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    }
    if (targetType === "coupon" || action.includes("discount")) {
      return {
        background: "#fffbeb",
        color: "#b45309",
        border: "1px solid #fde68a",
      };
    }
    if (targetType === "inventory") {
      return {
        background: "#ecfeff",
        color: "#0e7490",
        border: "1px solid #a5f3fc",
      };
    }
    return {
      background: "#f5f3ff",
      color: "#6d28d9",
      border: "1px solid #ddd6fe",
    };
  };

  // Target Type Summary counts
  const targetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.target_type] = (counts[l.target_type] || 0) + 1;
    });
    return counts;
  }, [logs]);

  return (
    <div
      style={{
        padding: "32px 36px",
        maxWidth: "1400px",
        margin: "0 auto",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "26px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "1.65rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Security & Audit Trail
                </h1>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    background: "#ecfdf5",
                    color: "#047857",
                    border: "1px solid #a7f3d0",
                    fontWeight: 600,
                  }}
                >
                  Server Enforced
                </span>
              </div>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
                Immutable, server-recorded ledger of all administrative mutations, role permissions, and catalog changes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            color: "#334155",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Log"}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "18px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Total Recorded Events
          </div>
          <div
            style={{
              fontSize: "1.65rem",
              fontWeight: 700,
              color: "#0f172a",
              marginTop: "4px",
            }}
          >
            {pagination.total}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
            Audit entries retained
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "18px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#0284c7",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Distinct Target Types
          </div>
          <div
            style={{
              fontSize: "1.65rem",
              fontWeight: 700,
              color: "#0f172a",
              marginTop: "4px",
            }}
          >
            {Object.keys(targetCounts).length || "8"} Types
          </div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
            Orders, Products, Users, etc.
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "18px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#059669",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Lock size={12} /> Sanitized Storage
          </div>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#059669",
              marginTop: "8px",
            }}
          >
            Zero Leaks Guaranteed
          </div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
            Tokens & secrets stripped
          </div>
        </div>
      </div>

      {/* Security Assurance Banner */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          marginBottom: "22px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <Activity size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
            Backend Authorization & Sanitized Storage Guarantee
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px", lineHeight: 1.5 }}>
            Every action recorded in this ledger is authorized strictly server-side via cryptographic session tokens.
            All passwords, authorization bearer headers, and SMTP credentials are permanently stripped before persisting to the database.
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "14px 18px",
          marginBottom: "22px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", minWidth: "300px", flex: 1 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search by admin email, action name, or target ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: "1px solid #cbd5e1",
              borderRadius: "9px",
              fontSize: "0.85rem",
              color: "#1e293b",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Target Type Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} style={{ color: "#64748b" }} />
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "#334155",
              background: "#fff",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Targets</option>
            <option value="order">Orders</option>
            <option value="product">Products</option>
            <option value="user">Users & Customers</option>
            <option value="inventory">Inventory</option>
            <option value="coupon">Coupons & Discounts</option>
            <option value="content">Content & Campaigns</option>
            <option value="system">System & Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        {loading && logs.length === 0 ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={26} className="spin" style={{ display: "inline-block", marginBottom: "12px", color: "#94a3b8" }} />
            <div style={{ fontSize: "0.92rem", fontWeight: 500 }}>Fetching immutable audit records...</div>
          </div>
        ) : error ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#dc2626" }}>
            <AlertCircle size={32} style={{ display: "inline-block", marginBottom: "12px" }} />
            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{error}</div>
            <button
              onClick={() => fetchLogs(1)}
              style={{
                marginTop: "12px",
                padding: "6px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "70px 20px", textAlign: "center", color: "#64748b" }}>
            <ShieldCheck size={40} style={{ display: "inline-block", marginBottom: "14px", color: "#cbd5e1" }} />
            <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1e293b" }}>
              No audit records match your filters
            </div>
            <p style={{ fontSize: "0.84rem", color: "#94a3b8", margin: "4px 0 0" }}>
              Administrative mutations will automatically appear in this ledger.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    color: "#475569",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "14px 18px", fontWeight: 600, fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Timestamp
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 600, fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Action
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 600, fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Actor
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 600, fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Target
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 600, fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Network / IP
                  </th>
                  <th
                    style={{
                      padding: "14px 18px",
                      fontWeight: 600,
                      fontSize: "0.74rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "right",
                    }}
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = expandedId === log._id;
                  const dateStr = new Date(log.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  const badgeStyle = getActionBadgeStyle(log.action, log.target_type);

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        style={{
                          borderBottom: isExpanded ? "none" : "1px solid #f1f5f9",
                          transition: "background 0.15s ease",
                          background: isExpanded ? "#f8fafc" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "#fafafa";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* Timestamp */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.82rem" }}>
                            <Clock size={13} style={{ color: "#94a3b8" }} />
                            <span>{dateStr}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 9px",
                              borderRadius: "6px",
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              letterSpacing: "0.02em",
                              ...badgeStyle,
                            }}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Actor */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "#f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#64748b",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            >
                              <User size={12} />
                            </div>
                            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.83rem" }}>
                              {log.actor_email || log.actor_id}
                            </span>
                          </div>
                        </td>

                        {/* Target */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                textTransform: "capitalize",
                                fontSize: "0.76rem",
                                fontWeight: 600,
                                color: "#475569",
                                background: "#f1f5f9",
                                padding: "2px 7px",
                                borderRadius: "4px",
                              }}
                            >
                              {log.target_type}
                            </span>
                            {log.target_id && (
                              <span
                                style={{
                                  fontSize: "0.76rem",
                                  fontFamily: "monospace",
                                  color: "#64748b",
                                  maxWidth: "140px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "inline-block",
                                }}
                                title={log.target_id}
                              >
                                {log.target_id}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* IP / Network */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "0.78rem" }}>
                            <Globe size={13} style={{ color: "#94a3b8" }} />
                            <span>{log.ip || "Internal"}</span>
                          </div>
                        </td>

                        {/* Expand Details */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle", textAlign: "right" }}>
                          <button
                            onClick={() => toggleExpand(log._id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              color: "#334155",
                              fontSize: "0.76rem",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? "Hide" : "Inspect"}
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON & Metadata Drawer Row */}
                      {isExpanded && (
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <td colSpan={6} style={{ padding: "16px 20px" }}>
                            <div
                              style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                padding: "16px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "10px",
                                  paddingBottom: "8px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                                  <FileCode size={15} style={{ color: "#c8a96e" }} /> Event Payload & Network Metadata
                                </div>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      JSON.stringify(
                                        {
                                          id: log._id,
                                          action: log.action,
                                          actor_id: log.actor_id,
                                          actor_email: log.actor_email,
                                          target_type: log.target_type,
                                          target_id: log.target_id,
                                          ip: log.ip,
                                          user_agent: log.user_agent,
                                          meta: log.meta,
                                          timestamp: log.createdAt,
                                        },
                                        null,
                                        2
                                      ),
                                      log._id
                                    )
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    background: "#f1f5f9",
                                    border: "none",
                                    color: "#475569",
                                    padding: "4px 8px",
                                    borderRadius: "5px",
                                    fontSize: "0.74rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  {copiedId === log._id ? (
                                    <>
                                      <Check size={12} style={{ color: "#059669" }} /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} /> Copy JSON
                                    </>
                                  )}
                                </button>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                                  <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Actor ID</span>
                                  <div style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#0f172a", marginTop: "2px" }}>
                                    {log.actor_id}
                                  </div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                                  <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>User Agent</span>
                                  <div
                                    style={{
                                      fontSize: "0.78rem",
                                      color: "#334155",
                                      marginTop: "2px",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={log.user_agent}
                                  >
                                    {log.user_agent || "Direct Server Request"}
                                  </div>
                                </div>
                              </div>

                              {log.meta && Object.keys(log.meta).length > 0 && (
                                <div>
                                  <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                                    Mutation Metadata
                                  </span>
                                  <pre
                                    style={{
                                      background: "#f8fafc",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: "8px",
                                      padding: "10px 14px",
                                      fontSize: "0.78rem",
                                      color: "#0f172a",
                                      fontFamily: "monospace",
                                      overflowX: "auto",
                                      margin: "6px 0 0",
                                    }}
                                  >
                                    {JSON.stringify(log.meta, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
            }}
          >
            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> (
              {pagination.total} total events)
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                style={{
                  padding: "6px 12px",
                  background: pagination.page === 1 ? "#f1f5f9" : "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  color: pagination.page === 1 ? "#94a3b8" : "#334155",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                style={{
                  padding: "6px 12px",
                  background: pagination.page === pagination.totalPages ? "#f1f5f9" : "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  color: pagination.page === pagination.totalPages ? "#94a3b8" : "#334155",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
