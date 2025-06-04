import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import DropdownMenu from './DropdownMenu.jsx';

function DropdownRoot() {
  const [open, setOpen] = useState(false);
  const [hwAccelEnabled, setHwAccelEnabled] = useState(false); // Disabled by default

  useEffect(() => {
    // Query current hardware acceleration state from main process
    if (window.electronAPI && window.electronAPI.getHardwareAcceleration) {
      window.electronAPI.getHardwareAcceleration().then(setHwAccelEnabled);
    }
  }, [open]);

  function handleAction(id) {
    setOpen(false);
    if (id === 'toggle-hwaccel') {
      if (window.electronAPI && window.electronAPI.toggleHardwareAcceleration) {
        window.electronAPI.toggleHardwareAcceleration().then(setHwAccelEnabled);
      }
      return;
    }
    setTimeout(() => {
      const btn = document.getElementById(id);
      if (btn) btn.click();
    }, 10);
  }

  useEffect(() => {
    const menuBtn = document.getElementById('menu-btn');
    if (!menuBtn) return;
    const toggle = () => setOpen(o => !o);
    menuBtn.addEventListener('click', toggle);
    return () => menuBtn.removeEventListener('click', toggle);
  }, []);

  return <DropdownMenu open={open} onClose={() => setOpen(false)} onAction={handleAction} hwAccelEnabled={hwAccelEnabled} />;
}

const dropdownContainer = document.querySelector('.dropdown');
if (dropdownContainer) {
  const reactRoot = document.createElement('div');
  reactRoot.id = 'dropdown-root';
  dropdownContainer.appendChild(reactRoot);
  createRoot(reactRoot).render(<DropdownRoot />);
}

