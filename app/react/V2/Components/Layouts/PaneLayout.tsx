import React from 'react';
import { PaneLayoutProps } from './PaneLayout/types';
import { PaneLayoutDesktop } from './PaneLayout/PaneLayoutDesktop';
import { Pane } from './PaneLayout/Pane';
import { PaneLayoutMobile } from './PaneLayout/PaneLayoutMobile';
import { useIsMobile } from '../../CustomHooks/useIsMobile';

const PaneLayout = ({
  children,
  localStorageKey,
  defaultWidthsPercents,
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
      defaultWidthsPercents={defaultWidthsPercents}
    >
      {children}
    </PaneLayoutDesktop>
  );
};

PaneLayout.Pane = Pane;

export { PaneLayout };
