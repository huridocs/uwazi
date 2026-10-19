import React from 'react';
import RenderIfVisibleModule from 'react-render-if-visible';
import { resolveDefaultExport } from '#shared/resolveDefaultExport.js';

type RenderIfVisibleProps = {
  defaultHeight?: number;
  visibleOffset?: number;
  initialVisible?: boolean;
  rootElementClass?: string;
  children: React.ReactNode;
};

type PackageRenderIfVisibleProps = RenderIfVisibleProps & {
  stayRendered?: boolean;
};

const passthrough = ({ children }: { children: React.ReactNode }): React.ReactNode => children;

const PackageRenderIfVisible = resolveDefaultExport<
  React.ComponentType<PackageRenderIfVisibleProps>
>(RenderIfVisibleModule, passthrough, component => typeof component === 'function');

const RenderIfVisible = ({
  defaultHeight,
  visibleOffset,
  initialVisible = false,
  rootElementClass,
  children,
}: RenderIfVisibleProps) => {
  if (typeof window !== 'undefined' && typeof IntersectionObserver === 'undefined') {
    return <>{children}</>;
  }

  return (
    <PackageRenderIfVisible
      defaultHeight={defaultHeight}
      visibleOffset={visibleOffset}
      initialVisible={initialVisible}
      rootElementClass={rootElementClass}
      stayRendered={false}
    >
      {children}
    </PackageRenderIfVisible>
  );
};

export type { RenderIfVisibleProps };
export { RenderIfVisible };
