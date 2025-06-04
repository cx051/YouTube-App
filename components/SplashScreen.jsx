import React, { useEffect, useRef } from 'react';

const SplashScreen = () => {
  // Simple animated loader (rotating SVG)
  return (
    <div style={{
      width: 240,
      height: 240,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(30,30,30,0.98)',
      borderRadius: 24,
      boxShadow: '0 6px 32px #000b',
      margin: 'auto',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999
    }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" stroke="#e50914" strokeWidth="10" fill="none" opacity="0.2"/>
        <circle cx="60" cy="60" r="50" stroke="#e50914" strokeWidth="10" fill="none" strokeDasharray="314" strokeDashoffset="0" style={{
          transformOrigin: 'center',
          animation: 'spin 1.2s linear infinite'
        }}/>
        <style>{`
          @keyframes spin {
            0% { stroke-dashoffset: 314; }
            100% { stroke-dashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
};

export default SplashScreen;
