"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Percent,
  Plus,
  Search,
  Copy,
  Check,
  Calendar,
  Trash2,
  RefreshCw,
  X,
  Tag,
} from "lucide-react";

interface CouponItem {
  _id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  expiryDate?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsDashboardPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons);
      } else {
        showToast(data.error || "Failed to load coupons", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Network error loading coupons", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleCouponStatus = async (coupon: CouponItem) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === coupon._id ? { ...c, isActive: !c.isActive } : c))
        );
        showToast(`Coupon ${coupon.code} ${!coupon.isActive ? "activated" : "deactivated"}`);
      } else {
        showToast(data.error || "Could not update coupon status", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Network error", "error");
    }
  };

  const deleteCoupon = async (coupon: CouponItem) => {
    if (!window.confirm(`Delete coupon "${coupon.code}" permanently?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c._id !== coupon._id));
        showToast(`Coupon ${coupon.code} removed`);
      } else {
        showToast(data.error || "Could not delete coupon", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Network error", "error");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast("Please enter a coupon code", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          description: description.trim(),
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrderAmount) || 0,
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => [data.coupon, ...prev]);
        setIsModalOpen(false);
        setCode("");
        setDescription("");
        setDiscountValue(10);
        setMinOrderAmount(0);
        setMaxDiscountAmount("");
        setExpiryDate("");
        setUsageLimit("");
        showToast(`Coupon ${data.coupon.code} created successfully!`, "success");
      } else {
        showToast(data.error || "Failed to create coupon", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
            <Percent size={24} style={{ color: "#c8a96e" }} />
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Discounts & Coupons
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Create and manage promotional discount codes, percentage vouchers, and customer rewards.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchCoupons}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
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

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              background: "#0f172a",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Create Coupon
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            { key: "all", label: "All Coupons" },
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key as any)}
              style={{
                padding: "7px 12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: statusFilter === btn.key ? "#0f172a" : "#f1f5f9",
                color: statusFilter === btn.key ? "#fff" : "#475569",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: "12px", display: "inline-block" }} />
            <div>Loading promotional coupons...</div>
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <Tag size={36} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#334155" }}>No discount coupons found</div>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Click "Create Coupon" to add your first promotional voucher.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                  <th style={{ padding: "12px 18px" }}>Coupon Code</th>
                  <th style={{ padding: "12px 18px" }}>Discount Value</th>
                  <th style={{ padding: "12px 18px" }}>Min. Spend</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Uses</th>
                  <th style={{ padding: "12px 18px" }}>Expiry Date</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              background: "#f1f5f9",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              letterSpacing: "0.06em",
                              color: "#0f172a",
                            }}
                          >
                            {c.code}
                          </span>
                          <button
                            onClick={() => handleCopy(c.code)}
                            title="Copy Code"
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                          >
                            {copiedCode === c.code ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                          </button>
                        </div>
                        {c.description && (
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "3px" }}>
                            {c.description}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "12px 18px", fontWeight: 700, color: "#0f172a" }}>
                        {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                        {c.maxDiscountAmount ? (
                          <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 400 }}>
                            Up to ₹{c.maxDiscountAmount.toLocaleString("en-IN")}
                          </div>
                        ) : null}
                      </td>

                      <td style={{ padding: "12px 18px", color: "#334155" }}>
                        {c.minOrderAmount > 0 ? `₹${c.minOrderAmount.toLocaleString("en-IN")}` : "No minimum"}
                      </td>

                      <td style={{ padding: "12px 18px", textAlign: "center", color: "#334155" }}>
                        {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : "times"}
                      </td>

                      <td style={{ padding: "12px 18px", color: isExpired ? "#dc2626" : "#475569" }}>
                        {c.expiryDate ? (
                          <span>
                            {new Date(c.expiryDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                            {isExpired && <span style={{ fontSize: "0.7rem", color: "#dc2626", display: "block" }}>Expired</span>}
                          </span>
                        ) : (
                          "Never expires"
                        )}
                      </td>

                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <button
                          onClick={() => toggleCouponStatus(c)}
                          style={{
                            border: "none",
                            background: c.isActive && !isExpired ? "#dcfce7" : "#fee2e2",
                            color: c.isActive && !isExpired ? "#15803d" : "#dc2626",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {c.isActive && !isExpired ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td style={{ padding: "12px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => deleteCoupon(c)}
                          title="Delete Coupon"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "6px",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "520px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>Create New Coupon</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Coupon Code (uppercase)*
                </label>
                <input
                  type="text"
                  placeholder="e.g. BESPOKE10, FESTIVE500"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.05em" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10% off bridal couture"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Discount Value ({discountType === "percentage" ? "%" : "₹"})*
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === "percentage" ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Min. Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = no minimum"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                {discountType === "percentage" ? (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Optional cap"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 100 uses"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Expiry Date (optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "9px 20px", borderRadius: "6px", border: "none", background: "#0f172a", color: "#fff", fontWeight: 600, cursor: submitting ? "wait" : "pointer" }}
                >
                  {submitting ? "Saving..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
