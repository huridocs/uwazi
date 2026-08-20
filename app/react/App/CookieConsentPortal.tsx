import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';

type CookieConsentPortalProps = {
  children: React.ReactNode;
};

const portalStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '1rem',
  insetInlineEnd: '1rem',
  zIndex: 50,
  width: 'auto',
  maxWidth: 'calc(100vw - 2rem)',
  pointerEvents: 'none',
};

const CookieConsentPortal = ({ children }: CookieConsentPortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <ThemeProvider className="tw-content" style={portalStyle}>
      <div className="pointer-events-auto">{children}</div>
    </ThemeProvider>,
    document.body
  );
};

export { CookieConsentPortal };
