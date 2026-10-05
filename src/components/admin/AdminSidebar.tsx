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
  Boxes,
  Percent,
  Star,
  Settings,
  Mail,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: { name: string; productType: string; icon: React.ElementType }[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Catalog & Inventory",
    items: [
      {
        name: "Products",
        path: "/dashboard/products",
        icon: Package,
        subItems: [
          { name: "Couture", productType: "couture", icon: Sparkles },
          { name: "Jewellery", productType: "jewellery", icon: Gem },
          { name: "Accessories", productType: "accessories", icon: Tags },
          { name: "Footwear", productType: "footwear", icon: Briefcase },
        ],
      },
      { name: "Categories", path: "/dashboard/taxonomies", icon: Layers },
      { name: "Inventory", path: "/dashboard/inventory", icon: Boxes },
    ],
  },
  {
    group: "Sales & Customers",
    items: [
      { name: "Orders", path: "/dashboard/orders", icon: ShoppingBag },
      { name: "Customers", path: "/dashboard/users", icon: Users },
      { name: "Discounts & Coupons", path: "/dashboard/coupons", icon: Percent },
    ],
  },
  {
    group: "Content & Marketing",
    items: [
      { name: "Campaigns", path: "/dashboard/campaigns", icon: ImageIcon },
      { name: "Homepage Sections", path: "/dashboard/homepage", icon: LayoutTemplate },
      { name: "Reviews", path: "/dashboard/reviews", icon: Star },
    ],
  },
  {
    group: "Operations & System",
    items: [
      { name: "Notifications / Email", path: "/dashboard/notifications", icon: Mail },
      { name: "Audit Logs", path: "/dashboard/audit-logs", icon: ShieldCheck },
      { name: "Settings", path: "/dashboard/settings", icon: Settings },
    ],
  },
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
        {navGroups.map((group, gIdx) => (
          <div key={group.group} style={{ marginBottom: "10px" }}>
            <div
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#525252",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "8px 12px 4px",
              }}
            >
              {group.group}
            </div>

            {group.items.map((item) => {
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
                        padding: "9px 12px",
                        backgroundColor:
                          isProductsActive
                            ? "rgba(255,255,255,0.08)"
                            : "transparent",
                        color: isProductsActive ? "#fff" : "#999",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        borderRadius: "6px",
                        fontSize: "0.84rem",
                        fontFamily: "inherit",
                        fontWeight: isProductsActive ? 500 : 400,
                        transition: "all 0.2s",
                      }}
                    >
                      <Icon size={15} />
                      <span style={{ flex: 1 }}>{item.name}</span>
                      {expanded ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </button>

                    {expanded && (
                      <div
                        style={{
                          marginLeft: "24px",
                          marginTop: "2px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          borderLeft: "1px solid rgba(255,255,255,0.08)",
                          paddingLeft: "10px",
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
                                padding: "7px 10px",
                                color: isSubActive ? "#fff" : "#777",
                                textDecoration: "none",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: isSubActive ? 600 : 400,
                                backgroundColor: isSubActive
                                  ? "rgba(255,255,255,0.08)"
                                  : "transparent",
                                transition: "all 0.15s",
                              }}
                            >
                              <SubIcon size={12} />
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
                    padding: "9px 12px",
                    backgroundColor:
                      isActive && !currentProductType
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                    color:
                      isActive && !currentProductType ? "#fff" : "#999",
                    textDecoration: "none",
                    borderRadius: "6px",
                    fontSize: "0.84rem",
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
                        height: "18px",
                        background: "#c8a96e",
                        borderRadius: "0 2px 2px 0",
                      }}
                    />
                  )}
                  <Icon size={15} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
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
