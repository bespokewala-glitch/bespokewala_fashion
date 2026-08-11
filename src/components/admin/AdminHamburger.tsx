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
        padding: "13px 10px", 
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "opacity 0.2s ease",
        margin: 0,
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.opacity = "0.7";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.opacity = "1";
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
