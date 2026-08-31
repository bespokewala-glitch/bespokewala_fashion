import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Accessible breadcrumb navigation for product and category pages.
 *
 * Renders real <a> links inside a semantic <nav aria-label="breadcrumb"> / <ol>
 * so Googlebot can follow them — unlike JSON-LD which is invisible to users.
 *
 * Design intent: visually light so it doesn't compete with the luxury design.
 * The last item (current page) is not a link — it's the active location.
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="breadcrumb"
      style={{
        fontSize: '0.75rem',
        color: '#999',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
      }}
    >
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              aria-current={isLast ? 'page' : undefined}
            >
              {/* Separator — not rendered before the first item */}
              {index > 0 && (
                <span aria-hidden="true" style={{ color: '#ccc', userSelect: 'none' }}>
                  /
                </span>
              )}

              {isLast ? (
                // Current page — not a link
                <span style={{ color: '#444' }}>{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  style={{
                    color: '#999',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
