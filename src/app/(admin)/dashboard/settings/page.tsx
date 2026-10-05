"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  CreditCard,
  Cloud,
  Mail,
  Database,
  Globe,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function SettingsDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>("Connected");

  return (
    <div style={{ padding: "32px 36px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "26px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings size={24} style={{ color: "#c8a96e" }} />
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Store Settings & System Configuration
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Overview of store operational environment, payment gateway credentials, cloud assets, and security configurations.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Brand & Store Profile */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Globe size={18} color="#c8a96e" />
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Brand & Store Identity</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Store Name:</span>
              <span style={{ fontWeight: 600 }}>Bespokewala</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Category:</span>
              <span>Luxury Bespoke Fashion & Bridal Couture</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Base Currency:</span>
              <span style={{ fontWeight: 600 }}>INR (₹)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Timezone:</span>
              <span>Asia/Kolkata (IST +05:30)</span>
            </div>
          </div>
        </div>

        {/* Payment Gateway (Razorpay) */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <CreditCard size={18} color="#0284c7" />
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Payment Gateway</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Gateway Provider:</span>
              <span style={{ fontWeight: 600 }}>Razorpay</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Webhook Endpoint:</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#0284c7" }}>/api/webhooks/razorpay</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Supported Methods:</span>
              <span>UPI, Cards, NetBanking, Wallets</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>HMAC Signature:</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>Enforced & Verified</span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Database size={18} color="#16a34a" />
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Database & Cloud Assets</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Database:</span>
              <span style={{ fontWeight: 600 }}>MongoDB (Mongoose ODM)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Image Storage:</span>
              <span style={{ fontWeight: 600 }}>Google Cloud Storage (GCS)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Image Optimization:</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>WebP / AVIF Responsive</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Connection State:</span>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>● Active</span>
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Shield size={18} color="#7c3aed" />
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Security & Sessions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Password Encryption:</span>
              <span style={{ fontWeight: 600 }}>Bcrypt (10 Salt Rounds)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Session Cookie:</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>HttpOnly, SameSite=Lax</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>OAuth Providers:</span>
              <span>Google Identity OAuth 2.0</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Rate Limiting:</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>Active (IP + Account)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
