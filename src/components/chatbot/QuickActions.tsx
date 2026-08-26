'use client';

import React from 'react';

interface QuickAction {
  label: string;
  value: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onSelect: (value: string) => void;
}

export default function QuickActions({ actions, onSelect }: QuickActionsProps) {
  return (
    <div style={{ padding: '0 0 0.5rem' }}>
      <div style={{
        fontSize: '0.65rem',
        color: '#b0a89f',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '0.65rem',
        textAlign: 'center',
      }}>
        Quick Start
      </div>
      <div className="chatbot-quick-actions" style={{ justifyContent: 'center' }}>
        {actions.map((action) => (
          <button
            key={action.value}
            className="chatbot-quick-btn"
            onClick={() => onSelect(action.value)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
