"use client";

import React from "react";

export default function AdminHamburger() {
  const openSidebar = () => {
    window.dispatchEvent(new Event("openAdminSidebar"));
  };

  return (
    <button
      className="desktop-hide"
      onClick={openSidebar}
      aria-label="Open Admin Menu"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        width: "40px",
        height: "40px",
        padding: "13px 10px", // Maintains ~14px total icon height inside the 40px box
        backgroundColor: "#ffffff",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 0.2s ease",
        marginRight: "16px",
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = "#fafafa";
        e.currentTarget.style.borderColor = "#e5e7eb";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = "#ffffff";
        e.currentTarget.style.borderColor = "#f0f0f0";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.96)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* 3 Thin lines - 18px width, 1.5px thickness, charcoal color */}
      <span style={{ display: "block", width: "18px", height: "1.5px", backgroundColor: "#1a1a1a", borderRadius: "2px" }} />
      <span style={{ display: "block", width: "18px", height: "1.5px", backgroundColor: "#1a1a1a", borderRadius: "2px" }} />
      <span style={{ display: "block", width: "18px", height: "1.5px", backgroundColor: "#1a1a1a", borderRadius: "2px" }} />
    </button>
  );
}
