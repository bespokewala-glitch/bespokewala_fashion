"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Server,
  ShieldCheck,
  Package,
  Bell,
} from "lucide-react";

interface SmtpStatus {
  success: boolean;
  configured: boolean;
  host: string | null;
  port: string;
  user: string | null;
  from: string | null;
  adminTo: string | null;
  error: string | null;
}

const EMAIL_TRIGGERS = [
  {
    name: "Customer Welcome Email",
    category: "Account",
    trigger: "New user completes registration",
    endpoint: "POST /api/auth/register",
    recipient: "Customer",
    status: "Active",
  },
  {
    name: "Email OTP Verification",
    category: "Security",
    trigger: "User requests OTP verification",
    endpoint: "POST /api/auth/otp/send",
    recipient: "Customer",
    status: "Active",
  },
  {
    name: "Password Reset Code",
    category: "Security",
    trigger: "User requests password reset",
    endpoint: "POST /api/auth/forgot-password",
    recipient: "Customer",
    status: "Active",
  },
  {
    name: "New Sign-In Security Alert",
    category: "Security",
    trigger: "Successful password login detected",
    endpoint: "POST /api/auth/login",
    recipient: "Customer",
    status: "Active",
  },
  {
    name: "Order Confirmation & Invoice",
    category: "Orders",
    trigger: "Payment verified via Razorpay",
    endpoint: "POST /api/orders/verify-payment",
    recipient: "Customer",
    status: "Active",
  },
  {
    name: "New Order Admin Alert",
    category: "Orders",
    trigger: "Paid order confirmed",
    endpoint: "POST /api/orders/verify-payment",
    recipient: "Admin Team",
    status: "Active",
  },
  {
    name: "Order Status Lifecycle Email",
    category: "Orders",
    trigger: "Admin updates order status (Production, QC, Dispatched, Delivered)",
    endpoint: "PUT /api/admin/orders/[id]",
    recipient: "Customer",
    status: "Active",
  },
  {
    name: "Payment Failure Alert",
    category: "Payments",
    trigger: "Razorpay payment.failed webhook",
    endpoint: "POST /api/webhooks/razorpay",
    recipient: "Customer",
    status: "Active",
  },
  {
    name: "Refund Initiated Notice",
    category: "Payments",
    trigger: "Razorpay refund.created webhook",
    endpoint: "POST /api/webhooks/razorpay",
    recipient: "Customer",
    status: "Active",
  },
];

export default function NotificationsDashboardPage() {
  const [smtp, setSmtp] = useState<SmtpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const checkSmtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email/test");
      const data = await res.json();
      setSmtp(data);
    } catch (e: any) {
      showToast(e.message || "Failed to check SMTP connection", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSmtp();
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      showToast("Please enter a destination email", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Test email successfully delivered to ${testEmail}!`, "success");
      } else {
        showToast(data.error || "Failed to deliver test email.", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Network error", "error");
    } finally {
      setSending(false);
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
            <Mail size={24} style={{ color: "#c8a96e" }} />
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Notifications & Email System
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Monitor SMTP infrastructure health, send diagnostic test emails, and review automated transactional triggers.
          </p>
        </div>

        <button
          onClick={checkSmtp}
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
          <RefreshCw size={14} /> Refresh SMTP Status
        </button>
      </div>

      {/* SMTP Connection Card & Live Dispatcher */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px", marginBottom: "28px" }}>
        {/* Connection Status */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
              <Server size={18} color="#7c3aed" /> SMTP Server Status
            </div>
            {loading ? (
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Checking...</span>
            ) : smtp?.success ? (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 10px", borderRadius: "12px" }}>
                <CheckCircle2 size={13} /> Connected & Verified
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "3px 10px", borderRadius: "12px" }}>
                <AlertCircle size={13} /> {smtp?.configured ? "Connection Error" : "Not Configured"}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Host:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{smtp?.host || "Not set in .env.local"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Port:</span>
              <span style={{ fontFamily: "monospace" }}>{smtp?.port || "587"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Sender Account:</span>
              <span style={{ fontFamily: "monospace" }}>{smtp?.user || "Not configured"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Admin Alerts To:</span>
              <span style={{ fontFamily: "monospace" }}>{smtp?.adminTo || "EMAIL_ADMIN_TO"}</span>
            </div>
          </div>

          {smtp?.error && (
            <div style={{ marginTop: "14px", padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "0.78rem", color: "#b91c1c", lineHeight: 1.5 }}>
              <strong>Notice:</strong> {smtp.error}
            </div>
          )}
        </div>

        {/* Live Test Dispatcher */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", marginBottom: "12px" }}>
            <Send size={18} color="#0284c7" /> Live Diagnostic Test Email
          </div>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.84rem" }}>
            Send a real branded test email to verify that your inbox receives messages without being marked as spam.
          </p>

          <form onSubmit={handleSendTestEmail} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Target Recipient Email
              </label>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  color: "#0f172a",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: sending ? "wait" : "pointer",
                marginTop: "4px",
              }}
            >
              <Send size={14} />
              {sending ? "Sending..." : "Dispatch Test Email"}
            </button>
          </form>
        </div>
      </div>

      {/* Registered Email Triggers Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
            Registered Transactional Email Triggers ({EMAIL_TRIGGERS.length})
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            All templates render luxury Bespokewala branding and run asynchronously without blocking API routes.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                <th style={{ padding: "12px 18px" }}>Template Name</th>
                <th style={{ padding: "12px 18px" }}>Category</th>
                <th style={{ padding: "12px 18px" }}>Business Trigger Event</th>
                <th style={{ padding: "12px 18px" }}>API Route</th>
                <th style={{ padding: "12px 18px" }}>Target</th>
                <th style={{ padding: "12px 18px", textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {EMAIL_TRIGGERS.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{t.name}</td>
                  <td style={{ padding: "12px 18px", color: "#64748b" }}>{t.category}</td>
                  <td style={{ padding: "12px 18px", color: "#334155" }}>{t.trigger}</td>
                  <td style={{ padding: "12px 18px", fontFamily: "monospace", fontSize: "0.78rem", color: "#0284c7" }}>{t.endpoint}</td>
                  <td style={{ padding: "12px 18px", color: "#334155" }}>{t.recipient}</td>
                  <td style={{ padding: "12px 18px", textAlign: "center" }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
