"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  FileCode,
  AlertCircle,
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
        setError(err.message || "An unexpected error occurred");
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

  const getActionBadgeColor = (action: string, targetType: string) => {
    if (action.includes("deleted") || action.includes("suspended")) {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
    if (action.includes("created")) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (action.includes("status_updated") || targetType === "order") {
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
    if (targetType === "coupon" || action.includes("discount")) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
    if (targetType === "inventory") {
      return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
    }
    return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Security & Audit Trail
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Server Enforced
                </span>
              </h1>
              <p className="text-sm text-neutral-400 mt-0.5">
                Immutable, server-recorded ledger of all administrative mutations, role permissions, and inventory changes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Log
        </button>
      </div>

      {/* Security Assurance Banner */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-3">
        <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-neutral-200">
            Backend Authorization & Sanitized Storage Guarantee
          </p>
          <p>
            Every action recorded in this ledger is authorized strictly server-side via cryptographic session tokens. 
            All passwords, authorization bearer headers, and SMTP secrets are strictly stripped before persisting to the MongoDB AuditLog repository.
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by admin email, action name, or target ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Target Type Filter */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-neutral-500 shrink-0" />
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-300 focus:outline-none focus:border-amber-500 transition"
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
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
            <p className="text-sm">Fetching immutable audit records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => fetchLogs(1)}
              className="px-4 py-2 rounded-xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
            >
              Try Again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-neutral-600" />
            <p className="text-sm font-medium text-neutral-300">No audit log records match your filter criteria.</p>
            <p className="text-xs text-neutral-500">Perform administrative operations to generate event logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target</th>
                  <th className="py-3.5 px-4">IP / Network</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-xs">
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

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-neutral-800/40 transition">
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-sans">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            {dateStr}
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${getActionBadgeColor(
                              log.action,
                              log.target_type
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-200">
                          <div className="flex items-center gap-1.5 font-sans">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-medium">{log.actor_email || log.actor_id}</span>
                          </div>
                        </td>

                        {/* Target */}
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-300">
                          <div className="flex items-center gap-1.5 font-sans">
                            <Layers className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="capitalize font-medium text-neutral-200">{log.target_type}</span>
                            {log.target_id && (
                              <span className="text-neutral-500 text-[11px] font-mono">
                                ({log.target_id.slice(-6)})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* IP Address */}
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-500">
                          {log.ip || "internal"}
                        </td>

                        {/* Expand Details */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => toggleExpand(log._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-xs font-sans"
                          >
                            <FileCode className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isExpanded ? "Hide" : "Inspect"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 ml-0.5" />
                            ) : (
                              <ChevronDown className="w-3 h-3 ml-0.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Metadata Row */}
                      {isExpanded && (
                        <tr className="bg-neutral-950/80 border-y border-neutral-800/80">
                          <td colSpan={6} className="p-4">
                            <div className="space-y-3 font-sans">
                              <div className="flex items-center justify-between text-xs text-neutral-400">
                                <span className="font-semibold text-neutral-300">
                                  Audit Payload & Event Metadata:
                                </span>
                                <span>Target ID: {log.target_id || "N/A"}</span>
                              </div>
                              <pre className="p-3.5 rounded-xl bg-black/60 border border-neutral-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-64">
                                {JSON.stringify(
                                  {
                                    action: log.action,
                                    target_type: log.target_type,
                                    target_id: log.target_id,
                                    actor_id: log.actor_id,
                                    actor_email: log.actor_email,
                                    ip: log.ip,
                                    user_agent: log.user_agent,
                                    meta: log.meta || {},
                                  },
                                  null,
                                  2
                                )}
                              </pre>
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

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div>
              Showing page <span className="text-white font-medium">{pagination.page}</span> of{" "}
              <span className="text-white font-medium">{pagination.totalPages}</span> ({pagination.total}{" "}
              total events)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
