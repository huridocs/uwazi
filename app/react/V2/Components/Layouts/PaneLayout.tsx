import React from 'react';
import { PaneLayoutProps } from './PaneLayout/types.js';
import { PaneLayoutDesktop } from './PaneLayout/PaneLayoutDesktop.js';
import { Pane } from './PaneLayout/Pane.js';
import { PaneLayoutMobile } from './PaneLayout/PaneLayoutMobile.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';

const PaneLayout = ({
  children,
  localStorageKey,
  defaultRatios,
  className = '',
}: PaneLayoutProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <PaneLayoutMobile className={className}>{children}</PaneLayoutMobile>;
  }

  return (
    <PaneLayoutDesktop
      localStorageKey={localStorageKey}
      className={className}
      defaultRatios={defaultRatios}
    >
      {children}
    </PaneLayoutDesktop>
  );
};

PaneLayout.Pane = Pane;

export { PaneLayout };
