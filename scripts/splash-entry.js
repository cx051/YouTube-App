import React from 'react';
import { createRoot } from 'react-dom/client';
import SplitText from '@cyriacbr/react-split-text';
import { motion } from 'framer-motion';

const logo = (
  <svg width="64" height="64" viewBox="0 0 64 64">
    <rect x="8" y="16" width="48" height="32" rx="8" fill="#FF0000" />
    <polygon points="30,24 46,32 30,40" fill="#fff" />
  </svg>
);

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.11, type: 'spring', stiffness: 300 } })
};

const SplashScreen = () => (
  <div style={{
    width: 440,
    height: 320,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(30,30,30,0.98)',
    borderRadius: 28,
    boxShadow: '0 12px 48px #000c',
    margin: 'auto',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999
  }}>
    <div style={{marginBottom: 18}}>{logo}</div>
    <SplitText
      LetterWrapper={({ letterIndex, children }) => (
        <motion.span
          style={{ display: 'inline-block', color: '#fff', fontWeight: 900, fontSize: 44, letterSpacing: 2, textShadow: '0 2px 8px #000a' }}
          custom={letterIndex}
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          {children}
        </motion.span>
      )}
    >YouTube</SplitText>
    <div style={{marginTop: 22, fontSize: 16, color: '#ff5e5e', fontWeight: 300, letterSpacing: 1, opacity: 0.85, fontFamily: 'monospace'}}>made with ♥ by cx051</div>
  </div>
);

const root = createRoot(document.getElementById('splash-root'));
root.render(<SplashScreen />);

// Remove splash after 2.5s or when window signals loaded
document.addEventListener('app-loaded', () => {
  root.unmount();
  document.getElementById('splash-root').remove();
});

setTimeout(() => {
  const splash = document.getElementById('splash-root');
  if (splash) {
    root.unmount();
    splash.remove();
  }
}, 2500);
