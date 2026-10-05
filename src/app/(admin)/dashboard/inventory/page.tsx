"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Edit,
  Save,
  Plus,
  Minus,
} from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface InventoryProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  inventoryCount: number;
  images?: string[];
  productType: string;
  category: string;
  subcategory?: string;
  details?: { styleCode?: string };
}

export default function InventoryDashboardPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low_stock" | "out_of_stock" | "in_stock">("all");
  const [productType, setProductType] = useState<string>("all");
  const [summary, setSummary] = useState({ totalOutOfStock: 0, totalLowStock: 0 });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (filter !== "all") params.set("filter", filter);
      if (productType !== "all") params.set("productType", productType);

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setSummary(data.summary || { totalOutOfStock: 0, totalLowStock: 0 });
        // initialize local edits
        const edits: Record<string, number> = {};
        data.products.forEach((p: InventoryProduct) => {
          edits[p._id] = p.inventoryCount;
        });
        setStockEdits(edits);
      } else {
        showToast(data.error || "Failed to load inventory", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error loading inventory", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filter, productType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchInventory]);

  const handleStockChange = (id: string, delta: number) => {
    setStockEdits((prev) => {
      const current = prev[id] !== undefined ? prev[id] : 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleStockInput = (id: string, value: string) => {
    const parsed = parseInt(value, 10);
    setStockEdits((prev) => ({
      ...prev,
      [id]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  const saveStock = async (product: InventoryProduct) => {
    const newStock = stockEdits[product._id];
    if (newStock === undefined || newStock === product.inventoryCount) return;

    setSavingId(product._id);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          inventoryCount: newStock,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, inventoryCount: newStock } : p))
        );
        showToast(`Stock updated for ${product.name}`, "success");
      } else {
        showToast(data.error || "Failed to update stock", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toast Notification */}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Boxes size={24} style={{ color: "#c8a96e" }} />
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Inventory Management
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Monitor real-time stock levels, resolve low-inventory warnings, and adjust quantities inline.
          </p>
        </div>

        <button
          onClick={fetchInventory}
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

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Catalog Items</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>{products.length}</div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Currently displayed</div>
        </div>

        <div
          onClick={() => setFilter("low_stock")}
          style={{
            background: filter === "low_stock" ? "#fff7ed" : "#fff",
            border: filter === "low_stock" ? "2px solid #ea580c" : "1px solid #fed7aa",
            borderRadius: "10px",
            padding: "16px 20px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.06em" }}>Low Stock Alert</span>
            <AlertTriangle size={16} color="#ea580c" />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#c2410c", marginTop: "4px" }}>{summary.totalLowStock}</div>
          <div style={{ fontSize: "0.8rem", color: "#ea580c", marginTop: "2px" }}>1 to 5 units remaining</div>
        </div>

        <div
          onClick={() => setFilter("out_of_stock")}
          style={{
            background: filter === "out_of_stock" ? "#fef2f2" : "#fff",
            border: filter === "out_of_stock" ? "2px solid #dc2626" : "1px solid #fecaca",
            borderRadius: "10px",
            padding: "16px 20px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Out of Stock</span>
            <XCircle size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#dc2626", marginTop: "4px" }}>{summary.totalOutOfStock}</div>
          <div style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: "2px" }}>0 units remaining</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by product name, category, or style code..."
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
        </div>

        {/* Filter Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All Items" },
            { key: "low_stock", label: "Low Stock (≤5)" },
            { key: "out_of_stock", label: "Out of Stock (0)" },
            { key: "in_stock", label: "In Stock (>5)" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key as any)}
              style={{
                padding: "7px 12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: filter === btn.key ? "#0f172a" : "#f1f5f9",
                color: filter === btn.key ? "#fff" : "#475569",
                transition: "all 0.15s",
              }}
            >
              {btn.label}
            </button>
          ))}

          {/* Type Dropdown */}
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#334155",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <option value="all">All Types</option>
            <option value="couture">Couture</option>
            <option value="jewellery">Jewellery</option>
            <option value="footwear">Footwear</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: "12px", display: "inline-block" }} />
            <div>Loading catalog inventory...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <Boxes size={36} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#334155" }}>No products found matching filters</div>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Try clearing search keywords or filter badges.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                  <th style={{ padding: "12px 18px", width: "70px" }}>Item</th>
                  <th style={{ padding: "12px 18px" }}>Product & Category</th>
                  <th style={{ padding: "12px 18px" }}>Price</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Stock Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Quick Stock Adjustment</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const currentEdit = stockEdits[p._id] !== undefined ? stockEdits[p._id] : p.inventoryCount;
                  const isDirty = currentEdit !== p.inventoryCount;
                  const isSaving = savingId === p._id;

                  return (
                    <tr key={p._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Image Thumbnail */}
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ width: "48px", height: "58px", borderRadius: "6px", overflow: "hidden", background: "#f1f5f9", position: "relative" }}>
                          {p.images && p.images[0] ? (
                            <OptimizedImage
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                              👗
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Product Name & Category */}
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.88rem" }}>{p.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "2px" }}>
                          <span style={{ textTransform: "capitalize" }}>{p.productType}</span> · <span style={{ textTransform: "capitalize" }}>{p.category}</span>
                          {p.subcategory && <span> · {p.subcategory}</span>}
                        </div>
                        {p.details?.styleCode && (
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                            SKU: {p.details.styleCode}
                          </div>
                        )}
                      </td>

                      {/* Price */}
                      <td style={{ padding: "12px 18px", fontWeight: 600, color: "#1e293b" }}>
                        ₹{p.price.toLocaleString("en-IN")}
                      </td>

                      {/* Stock Status Badge */}
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "14px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              p.inventoryCount === 0
                                ? "#fee2e2"
                                : p.inventoryCount <= 5
                                ? "#ffedd5"
                                : "#dcfce7",
                            color:
                              p.inventoryCount === 0
                                ? "#dc2626"
                                : p.inventoryCount <= 5
                                ? "#ea580c"
                                : "#15803d",
                          }}
                        >
                          {p.inventoryCount === 0 ? "Out of Stock" : `${p.inventoryCount} in stock`}
                        </span>
                      </td>

                      {/* Quick Stock Stepper / Input */}
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleStockChange(p._id, -1)}
                            disabled={currentEdit <= 0}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: currentEdit <= 0 ? "not-allowed" : "pointer",
                              opacity: currentEdit <= 0 ? 0.4 : 1,
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={currentEdit}
                            onChange={(e) => handleStockInput(p._id, e.target.value)}
                            style={{
                              width: "56px",
                              padding: "4px 6px",
                              textAlign: "center",
                              borderRadius: "4px",
                              border: isDirty ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              outline: "none",
                            }}
                          />

                          <button
                            onClick={() => handleStockChange(p._id, 1)}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Plus size={12} />
                          </button>

                          {isDirty && (
                            <button
                              onClick={() => saveStock(p)}
                              disabled={isSaving}
                              style={{
                                marginLeft: "6px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#16a34a",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "5px 10px",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                cursor: isSaving ? "wait" : "pointer",
                              }}
                            >
                              <Save size={12} />
                              {isSaving ? "..." : "Save"}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            title="View on Storefront"
                            style={{
                              color: "#64748b",
                              padding: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={15} />
                          </Link>

                          <Link
                            href={`/dashboard/products?search=${encodeURIComponent(p.name)}`}
                            title="Edit Product"
                            style={{
                              color: "#2563eb",
                              padding: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              textDecoration: "none",
                            }}
                          >
                            <Edit size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
