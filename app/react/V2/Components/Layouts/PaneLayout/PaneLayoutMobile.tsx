import React, { useEffect, useState } from 'react';
import { MobileBottomSheet } from './MobileBottomSheet.js';
import { PaneLayoutProps, PaneProps } from './types.js';

const isPane = (node: React.ReactNode): node is React.ReactElement<PaneProps> =>
  typeof node === 'object' && node !== null && 'props' in node;

const flattenPanes = (nodes: React.ReactNode): React.ReactElement<PaneProps>[] => {
  if (Array.isArray(nodes)) return nodes.flatMap(flattenPanes);
  return isPane(nodes) ? [nodes] : [];
};

const LEGACY_MENU_HEIGHT = '50px';

const useRequestedPane = (
  requestedPane: PaneLayoutProps['requestedPane'],
  setOpenCount: (index: number) => void
) => {
  const requestId = requestedPane?.id;
  const requestIndex = requestedPane?.index;

  useEffect(() => {
    if (requestIndex === undefined) return;
    setOpenCount(requestIndex);
  }, [requestId, requestIndex, setOpenCount]);
};

const PaneLayoutMobile = ({ children, className = '', requestedPane }: PaneLayoutProps) => {
  const [openCount, setOpenCount] = useState(0);
  useRequestedPane(requestedPane, setOpenCount);
  const [page, ...sheets] = flattenPanes(children);

  return (
    <>
      <section
        style={{
          maxHeight: `calc(min(100dvh, 100vh) - ${LEGACY_MENU_HEIGHT} - env(safe-area-inset-bottom, 0px))`,
        }}
        className={`relative flex h-full min-h-0 flex-col overflow-hidden ${className}`}
      >
        {page}
      </section>
      {sheets.map((child, offset) => {
        const index = offset + 1;
        if (index > openCount) return null;
        return (
          <MobileBottomSheet
            key={child.key ?? index}
            open
            order={index}
            title={child.props.mobileTitle}
            defaultSnap={child.props.mobileSnap ?? 'half'}
            onClose={() => {
              child.props.onMobileClose?.();
              setOpenCount(current => Math.min(current, index - 1));
            }}
          >
            {child}
          </MobileBottomSheet>
        );
      })}
    </>
  );
};

export { PaneLayoutMobile };
