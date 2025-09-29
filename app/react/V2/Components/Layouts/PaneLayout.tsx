import React, { useState, useEffect } from 'react';
import { isClient } from 'app/utils';
import { PaneLayoutProps } from './PaneLayout/types';
import { PaneLayoutDesktop } from './PaneLayout/PaneLayoutDesktop';
import { Pane } from './PaneLayout/Pane';
import { PaneLayoutMobile } from './PaneLayout/PaneLayoutMobile';

const MOBILE_VIEW_MAX_WIDTH = 768;

const PaneLayout = ({
  children,
  localStorageKey,
  defaultWidthsPercents,
  className = '',
}: PaneLayoutProps) => {
  const [isMobile, setIsMobile] = useState<boolean>();

  useEffect(() => {
    let maxWidthObserver: MediaQueryList;

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_VIEW_MAX_WIDTH);
    };

    if (isClient) {
      maxWidthObserver = window.matchMedia(`(max-width: ${MOBILE_VIEW_MAX_WIDTH - 1}px)`);

      maxWidthObserver.addEventListener('change', onChange);

      setIsMobile(window.innerWidth < MOBILE_VIEW_MAX_WIDTH);
    }

    return () => {
      if (maxWidthObserver) {
        maxWidthObserver.removeEventListener('change', onChange);
      }
    };
  }, []);

  if (isMobile) {
    return <PaneLayoutMobile className={className}>{children}</PaneLayoutMobile>;
  }

  return (
    <PaneLayoutDesktop
      localStorageKey={localStorageKey}
      className={className}
      defaultWidthsPercents={defaultWidthsPercents}
    >
      {children}
    </PaneLayoutDesktop>
  );
};

PaneLayout.Pane = Pane;

export { PaneLayout };
