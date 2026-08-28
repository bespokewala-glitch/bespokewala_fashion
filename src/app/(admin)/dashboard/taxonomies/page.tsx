"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Save, X, ToggleLeft, ToggleRight, Globe } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TaxonomySEO {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  image?: string;
  seoH1?: string;
  seoIntro?: string;
  seoContent?: string;
}

interface Taxonomy {
  _id: string;
  type: "collection" | "occasion" | "category";
  name: string;
  slug: string;
  order: number;
  enabled: boolean;
  productTypes: string[];
  genders: string[];
  seo?: TaxonomySEO;
  createdAt?: string;
  updatedAt?: string;
}

type TaxonomyType = "collection" | "occasion" | "category";

const PRODUCT_TYPES = ["couture", "jewellery", "footwear", "beauty", "diffusion"];
const GENDERS = ["womens", "mens", "unisex"];
const TAX_TYPES: TaxonomyType[] = ["category", "collection", "occasion"];

const emptyForm = (): Omit<Taxonomy, "_id" | "createdAt" | "updatedAt"> => ({
  type: "category",
  name: "",
  slug: "",
  order: 0,
  enabled: true,
  productTypes: [],
  genders: [],
  seo: {
    title: "",
    description: "",
    keywords: "",
    seoH1: "",
    seoIntro: "",
    seoContent: "",
    noIndex: false,
  },
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TaxonomiesPage() {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<TaxonomyType | "all">("all");

  // Form state
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTaxonomies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/taxonomies");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTaxonomies(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTaxonomies(); }, [fetchTaxonomies]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const openNew = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError("");
    setSeoOpen(false);
    setFormOpen(true);
  };

  const openEdit = (tax: Taxonomy) => {
    setForm({
      type: tax.type,
      name: tax.name,
      slug: tax.slug,
      order: tax.order,
      enabled: tax.enabled,
      productTypes: tax.productTypes || [],
      genders: tax.genders || [],
      seo: {
        title: tax.seo?.title || "",
        description: tax.seo?.description || "",
        keywords: tax.seo?.keywords || "",
        seoH1: tax.seo?.seoH1 || "",
        seoIntro: tax.seo?.seoIntro || "",
        seoContent: tax.seo?.seoContent || "",
        noIndex: tax.seo?.noIndex || false,
        image: tax.seo?.image || "",
        canonicalUrl: tax.seo?.canonicalUrl || "",
      },
    });
    setEditingId(tax._id);
    setFormError("");
    setSeoOpen(true); // open SEO panel by default when editing
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      // Auto-generate slug only if user hasn't manually changed it
      slug: editingId ? f.slug : toSlug(name),
    }));
  };

  const toggleMulti = (key: "productTypes" | "genders", value: string) => {
    setForm((f) => {
      const arr = f[key] as string[];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const setSEO = (field: keyof TaxonomySEO, value: string | boolean) => {
    setForm((f) => ({ ...f, seo: { ...f.seo, [field]: value } }));
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.slug.trim()) { setFormError("Slug is required"); return; }
    try {
      setSaving(true);
      setFormError("");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/taxonomies/${editingId}` : "/api/taxonomies";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      await fetchTaxonomies();
      closeForm();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (tax: Taxonomy) => {
    if (!confirm(`Delete "${tax.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/taxonomies/${tax._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchTaxonomies();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── Toggle enabled ─────────────────────────────────────────────────────────
  const handleToggleEnabled = async (tax: Taxonomy) => {
    try {
      const res = await fetch(`/api/taxonomies/${tax._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !tax.enabled }),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchTaxonomies();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = filterType === "all" ? taxonomies : taxonomies.filter((t) => t.type === filterType);
  const grouped: Record<string, Taxonomy[]> = {};
  TAX_TYPES.forEach((t) => { grouped[t] = filtered.filter((tx) => tx.type === t); });

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "2rem", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111", margin: 0 }}>Taxonomies</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage categories, collections, and occasions. Add <strong>SEO metadata</strong> to each for better Google rankings.
          </p>
        </div>
        <button onClick={openNew} style={btnPrimary}>
          <Plus size={16} /> Add Taxonomy
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["all", ...TAX_TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid",
              borderColor: filterType === t ? "#111" : "#ddd",
              backgroundColor: filterType === t ? "#111" : "#fff",
              color: filterType === t ? "#fff" : "#555",
              fontSize: "0.8rem",
              fontWeight: filterType === t ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t === "all" ? `All (${taxonomies.length})` : `${t} (${taxonomies.filter((tx) => tx.type === t).length})`}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && <p style={{ color: "#999" }}>Loading taxonomies…</p>}
      {error && <p style={{ color: "#c00" }}>{error}</p>}

      {/* Taxonomy Groups */}
      {!loading && !error && TAX_TYPES.map((type) => {
        const items = grouped[type];
        if (filterType !== "all" && filterType !== type) return null;
        return (
          <div key={type} style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: "0.75rem" }}>
              {type}s ({items.length})
            </h2>
            {items.length === 0 && (
              <div style={{ padding: "1.5rem", background: "#f9f9f9", borderRadius: "8px", color: "#999", fontSize: "0.875rem", textAlign: "center" }}>
                No {type}s yet. <button onClick={openNew} style={{ background: "none", border: "none", color: "#111", cursor: "pointer", textDecoration: "underline" }}>Add one</button>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {items.map((tax) => (
                <TaxonomyRow
                  key={tax._id}
                  tax={tax}
                  onEdit={() => openEdit(tax)}
                  onDelete={() => handleDelete(tax)}
                  onToggle={() => handleToggleEnabled(tax)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Form Drawer ─────────────────────────────────────────────────────── */}
      {formOpen && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={drawerStyle}>
            {/* Drawer header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid #eee" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                {editingId ? "Edit Taxonomy" : "New Taxonomy"}
              </h2>
              <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              {formError && (
                <div style={{ padding: "0.75rem 1rem", background: "#fff0f0", border: "1px solid #fcc", borderRadius: "6px", color: "#c00", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  {formError}
                </div>
              )}

              {/* Basic fields */}
              <div style={fieldGroup}>
                <label style={labelStyle}>Type *</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TaxonomyType }))} style={inputStyle}>
                  {TAX_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Name *</label>
                <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} style={inputStyle} placeholder="e.g. Lehenga" />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Slug * <span style={{ color: "#999", fontSize: "0.75rem" }}>(auto-generated, editable)</span></label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} style={inputStyle} placeholder="e.g. lehenga" />
                <p style={hintStyle}>URL segment used in /products/couture/<strong>{form.slug || "lehenga"}</strong></p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Display Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} style={inputStyle} min={0} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Status</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.enabled ? "#22c55e" : "#aaa", padding: 0 }}>
                      {form.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                    <span style={{ fontSize: "0.875rem", color: form.enabled ? "#22c55e" : "#aaa" }}>{form.enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Product Types</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {PRODUCT_TYPES.map((pt) => (
                    <button key={pt} onClick={() => toggleMulti("productTypes", pt)}
                      style={{ padding: "4px 12px", borderRadius: "20px", border: "1px solid", borderColor: form.productTypes.includes(pt) ? "#111" : "#ddd", backgroundColor: form.productTypes.includes(pt) ? "#111" : "#fff", color: form.productTypes.includes(pt) ? "#fff" : "#555", fontSize: "0.8rem", cursor: "pointer", textTransform: "capitalize" }}>
                      {pt}
                    </button>
                  ))}
                </div>
                <p style={hintStyle}>Which departments this taxonomy belongs to (used for sitemap + routing)</p>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {GENDERS.map((g) => (
                    <button key={g} onClick={() => toggleMulti("genders", g)}
                      style={{ padding: "4px 12px", borderRadius: "20px", border: "1px solid", borderColor: form.genders.includes(g) ? "#111" : "#ddd", backgroundColor: form.genders.includes(g) ? "#111" : "#fff", color: form.genders.includes(g) ? "#fff" : "#555", fontSize: "0.8rem", cursor: "pointer", textTransform: "capitalize" }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── SEO Section ─────────────────────────────────────────────── */}
              <div style={{ marginTop: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                <button
                  onClick={() => setSeoOpen((v) => !v)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "#f8f9fa", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "#111" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Globe size={16} /> SEO & Metadata</span>
                  {seoOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {seoOpen && (
                  <div style={{ padding: "1.25rem", background: "#fff" }}>
                    <p style={{ color: "#666", fontSize: "0.8rem", marginBottom: "1rem", lineHeight: "1.5" }}>
                      Fill these fields to control Google appearance for the <strong>/products/couture/{form.slug || "lehenga"}</strong> page.
                      Leave blank to auto-generate from the taxonomy name.
                    </p>

                    <div style={fieldGroup}>
                      <label style={labelStyle}>SEO Title <span style={charHint}>(recommended: 50–60 chars)</span></label>
                      <input value={form.seo?.title || ""} onChange={(e) => setSEO("title", e.target.value)} style={inputStyle}
                        placeholder={`e.g. Lehenga | Designer Lehenga Collection | Bespokewala`} />
                      <p style={hintStyle}>Appears in Google SERP. Leave blank to auto-generate: "Luxury Lehenga — Couture | Bespokewala"</p>
                    </div>

                    <div style={fieldGroup}>
                      <label style={labelStyle}>Meta Description <span style={charHint}>(recommended: 130–160 chars)</span></label>
                      <textarea value={form.seo?.description || ""} onChange={(e) => setSEO("description", e.target.value)} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                        placeholder="e.g. Shop luxury designer lehengas at Bespokewala. Handcrafted bridal and wedding lehengas in organza, silk and velvet." />
                      <CharCount text={form.seo?.description || ""} max={160} />
                    </div>

                    <div style={fieldGroup}>
                      <label style={labelStyle}>H1 Heading <span style={charHint}>(shown on page)</span></label>
                      <input value={form.seo?.seoH1 || ""} onChange={(e) => setSEO("seoH1", e.target.value)} style={inputStyle}
                        placeholder="e.g. Luxury Designer Lehengas for Women" />
                      <p style={hintStyle}>The main heading shown at top of the category page. Leave blank to auto-generate.</p>
                    </div>

                    <div style={fieldGroup}>
                      <label style={labelStyle}>SEO Intro <span style={charHint}>(short text below H1)</span></label>
                      <textarea value={form.seo?.seoIntro || ""} onChange={(e) => setSEO("seoIntro", e.target.value)} style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
                        placeholder="e.g. From bridal lehengas to festive wear — discover Bespokewala's curated lehenga collection." />
                      <p style={hintStyle}>1–2 sentences shown just below the H1. Supports basic HTML.</p>
                    </div>

                    <div style={fieldGroup}>
                      <label style={labelStyle}>SEO Content <span style={charHint}>(shown at bottom of page)</span></label>
                      <textarea value={form.seo?.seoContent || ""} onChange={(e) => setSEO("seoContent", e.target.value)} style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
                        placeholder="Write 200–400 words about this category. Mention bridal lehenga, wedding lehenga, designer lehenga naturally. Supports HTML." />
                      <p style={hintStyle}>Editorial content shown at the bottom of the page. Supports HTML. Aim for 200–400 words. Do not keyword-stuff.</p>
                    </div>

                    <div style={fieldGroup}>
                      <label style={labelStyle}>Keywords <span style={charHint}>(comma-separated)</span></label>
                      <input value={form.seo?.keywords || ""} onChange={(e) => setSEO("keywords", e.target.value)} style={inputStyle}
                        placeholder="lehenga, designer lehenga, bridal lehenga, wedding lehenga" />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <input type="checkbox" id="noIndex" checked={form.seo?.noIndex || false} onChange={(e) => setSEO("noIndex", e.target.checked)} />
                      <label htmlFor="noIndex" style={{ fontSize: "0.875rem", color: "#c00", cursor: "pointer" }}>
                        No-index this page (hides from Google — use only for internal/thin pages)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #eee", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={closeForm} style={btnSecondary}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                <Save size={15} /> {saving ? "Saving…" : editingId ? "Save Changes" : "Create Taxonomy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────
function TaxonomyRow({ tax, onEdit, onDelete, onToggle }: { tax: Taxonomy; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const hasSEO = !!(tax.seo?.title || tax.seo?.description || tax.seo?.seoH1 || tax.seo?.seoContent);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "#fff", border: "1px solid #eee", borderRadius: "8px", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111" }}>{tax.name}</span>
          {hasSEO && (
            <span title="Has SEO data" style={{ fontSize: "0.65rem", background: "#dcfce7", color: "#15803d", borderRadius: "4px", padding: "1px 6px", fontWeight: 600 }}>SEO ✓</span>
          )}
          {tax.seo?.noIndex && (
            <span title="No-indexed" style={{ fontSize: "0.65rem", background: "#fee2e2", color: "#c00", borderRadius: "4px", padding: "1px 6px", fontWeight: 600 }}>noindex</span>
          )}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "2px" }}>
          <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: "3px" }}>{tax.slug}</code>
          {tax.productTypes?.length > 0 && (
            <span style={{ marginLeft: "0.5rem" }}>→ {tax.productTypes.join(", ")}</span>
          )}
        </div>
      </div>

      <button onClick={onToggle} title={tax.enabled ? "Disable" : "Enable"}
        style={{ background: "none", border: "none", cursor: "pointer", color: tax.enabled ? "#22c55e" : "#ccc", padding: "4px" }}>
        {tax.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
      </button>

      <button onClick={onEdit} title="Edit" style={{ background: "none", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", color: "#555", padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
        <Pencil size={13} /> Edit
      </button>
      <button onClick={onDelete} title="Delete" style={{ background: "none", border: "1px solid #fcc", borderRadius: "6px", cursor: "pointer", color: "#c00", padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
        <Trash2 size={13} /> Delete
      </button>
    </div>
  );
}

// ─── Character counter ────────────────────────────────────────────────────────
function CharCount({ text, max }: { text: string; max: number }) {
  const len = text.length;
  const color = len > max ? "#c00" : len > max * 0.85 ? "#f59e0b" : "#22c55e";
  return (
    <span style={{ fontSize: "0.72rem", color, marginTop: "2px", display: "block" }}>
      {len} / {max} chars {len > max && "— too long!"}
    </span>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const fieldGroup: React.CSSProperties = { marginBottom: "1rem" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #ddd", borderRadius: "6px", fontSize: "0.875rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" };
const hintStyle: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", marginTop: "0.25rem" };
const charHint: React.CSSProperties = { color: "#9ca3af", fontSize: "0.72rem", fontWeight: 400 };
const btnPrimary: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#111", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, fontFamily: "inherit" };
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: "#fff", color: "#111", border: "1px solid #ddd" };
const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" };
const drawerStyle: React.CSSProperties = { width: "100%", maxWidth: "600px", background: "#fff", height: "100vh", display: "flex", flexDirection: "column", overflowY: "hidden", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" };
