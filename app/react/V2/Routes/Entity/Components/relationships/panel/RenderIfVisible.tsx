import React from 'react';
import RenderIfVisibleModule from 'react-render-if-visible';
import { resolveDefaultExport } from '#shared/resolveDefaultExport.js';

type RenderIfVisibleProps = {
  defaultHeight?: number;
  visibleOffset?: number;
  stayRendered?: boolean;
  rootElementClass?: string;
  placeholderElementClass?: string;
  children: React.ReactNode;
};

const Fallback = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const supportsObserver = typeof IntersectionObserver !== 'undefined';

const RenderIfVisible: React.ComponentType<RenderIfVisibleProps> = supportsObserver
  ? resolveDefaultExport<React.ComponentType<RenderIfVisibleProps>>(
      RenderIfVisibleModule,
      Fallback,
      component => typeof component === 'function'
    )
  : Fallback;

export { RenderIfVisible };
export type { RenderIfVisibleProps };
