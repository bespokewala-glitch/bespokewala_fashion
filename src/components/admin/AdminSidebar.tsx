"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Gem,
  Briefcase,
  Menu,
  X,
  Tags,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", path: "/dashboard/orders", icon: ShoppingBag },
  {
    name: "Products",
    path: "/dashboard/products",
    icon: Package,
    subItems: [
      { name: "Couture", productType: "couture", icon: Sparkles },
      { name: "Jewellery", productType: "jewellery", icon: Gem },
      { name: "Footwear", productType: "footwear", icon: Briefcase },
    ],
  },
  { name: "Users", path: "/dashboard/users", icon: Users },
  { name: "Taxonomies", path: "/dashboard/taxonomies", icon: Tags },
  { name: "Campaigns", path: "/dashboard/campaigns", icon: ImageIcon },
  { name: "Homepage Sections", path: "/dashboard/homepage", icon: LayoutTemplate },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentProductType = searchParams.get("productType");

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "/dashboard/products": pathname.startsWith("/dashboard/products"),
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => setIsMobileOpen(true);
    window.addEventListener("openAdminSidebar", handleOpen);
    return () => window.removeEventListener("openAdminSidebar", handleOpen);
  }, []);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <>

      <div 
        className={`admin-mobile-overlay desktop-hide ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <div
        className={`admin-mobile-sidebar admin-desktop-sidebar ${isMobileOpen ? 'open' : ''}`}
        style={{
        backgroundColor: "#0d0d0d",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          padding: "28px 20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              background: "#fff",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "#000",
              fontFamily: "serif"
            }}
          >
            B
          </div>
          <div>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                color: "#fff",
              }}
            >
              BESPOKEWALA
            </div>
            <div
              style={{
                fontSize: "0.6rem",
                color: "#999",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              Luxury Fashion Studio
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav
        style={{
          flex: 1,
          padding: "16px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "#444",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "6px 12px 8px",
          }}
        >
          Main Menu
        </div>

        {navItems.map((item) => {
          // Use mounted state to prevent hydration mismatches from Next.js router hooks
          const isActive = mounted && pathname === item.path;
          const isProductsActive = mounted && pathname.startsWith("/dashboard/products");
          const Icon = item.icon;

          if (item.subItems) {
            const expanded = expandedItems[item.path];
            return (
              <div key={item.path}>
                <button
                  onClick={() => toggleExpand(item.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    backgroundColor:
                      isProductsActive
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    color: isProductsActive ? "#fff" : "#888",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                    fontWeight: isProductsActive ? 500 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {expanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>

                {expanded && (
                  <div
                    style={{
                      marginLeft: "26px",
                      marginTop: "2px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      borderLeft: "1px solid rgba(255,255,255,0.06)",
                      paddingLeft: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    {item.subItems.map((sub: any) => {
                      const isSubActive =
                        isProductsActive && currentProductType === sub.productType;
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.productType}
                          href={`${item.path}?productType=${sub.productType}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 10px",
                            color: isSubActive ? "#fff" : "#666",
                            textDecoration: "none",
                            borderRadius: "8px",
                            fontSize: "0.83rem",
                            fontWeight: isSubActive ? 600 : 400,
                            backgroundColor: isSubActive
                              ? "rgba(255,255,255,0.08)"
                              : "transparent",
                            transition: "all 0.15s",
                          }}
                        >
                          <SubIcon size={13} />
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                backgroundColor:
                  isActive && !currentProductType
                    ? "rgba(255,255,255,0.06)"
                    : "transparent",
                color:
                  isActive && !currentProductType ? "#fff" : "#888",
                textDecoration: "none",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: isActive && !currentProductType ? 500 : 400,
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {isActive && !currentProductType && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "20px",
                    background: "#fff",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              <Icon size={16} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "16px 10px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "11px",
            background: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 500,
            transition: "opacity 0.2s",
          }}
        >
          <LogOut size={15} />
          Return to Store
        </Link>
      </div>
    </div>
    </>
  );
}
