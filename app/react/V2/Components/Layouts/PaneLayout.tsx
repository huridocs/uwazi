import React from 'react';
import { PaneLayoutProps } from '#V2/Components/Layouts/PaneLayout/types.js';
import { PaneLayoutDesktop } from '#V2/Components/Layouts/PaneLayout/PaneLayoutDesktop.jsx';
import { Pane } from '#V2/Components/Layouts/PaneLayout/Pane.jsx';
import { PaneLayoutMobile } from '#V2/Components/Layouts/PaneLayout/PaneLayoutMobile.jsx';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.jsx';

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
