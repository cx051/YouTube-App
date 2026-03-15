import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const menuItems = [
  { icon: '🔍+', label: 'Zoom In', id: 'zoom-in-btn' },
  { icon: '🔍−', label: 'Zoom Out', id: 'zoom-out-btn' },
  { icon: '🗑️', label: 'Clear Data', id: 'clear-data-btn' },
  { icon: '⚡', label: 'Toggle Hardware Acceleration', id: 'toggle-hwaccel' },
];

export default function DropdownMenu({ open, onClose, onAction, hwAccelEnabled }) {
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  const root = document.getElementById('dropdown-root');
  if (!root) return null;

  return createPortal(
    <div
      ref={ref}
      className="dropdown-content-react dropdown-animate"
      style={{ display: open ? 'block' : 'none' }}
      role="menu"
      aria-label="App Menu"
      tabIndex={-1}
    >
      {menuItems.map(item => (
        <button
          key={item.id}
          className="dropdown-btn-react"
          onClick={() => onAction(item.id)}
          role="menuitem"
          tabIndex={0}
        >
          <span className="menu-icon-react">{item.icon}</span>
          {item.id === 'toggle-hwaccel' ? (hwAccelEnabled !== undefined ? (hwAccelEnabled ? 'Disable' : 'Enable') + ' Hardware Acceleration' : item.label) : item.label}
        </button>
      ))}
    </div>,
    root
  );
}
