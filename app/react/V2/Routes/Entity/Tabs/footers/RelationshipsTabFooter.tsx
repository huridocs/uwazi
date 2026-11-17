import React, { useCallback, useRef, useSyncExternalStore } from 'react';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { RelationshipsActionBar } from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsSelectionState } from '#V2/Routes/Entity/Components/context/index.js';

const RELATIONSHIPS_FOOTER_WIDE_AT = 672;

const relationshipsFooterCompact = (width: number) =>
  width > 0 && width < RELATIONSHIPS_FOOTER_WIDE_AT;

const documentEvents = ['mousemove', 'mouseup', 'touchmove', 'touchend'];

const subscribeWidthFallback = (read: () => void) => {
  documentEvents.forEach(event => {
    document.addEventListener(event, read);
  });
  window.addEventListener('resize', read);
  return () => {
    documentEvents.forEach(event => {
      document.removeEventListener(event, read);
    });
    window.removeEventListener('resize', read);
  };
};

const useFooterWidth = (footerRef: React.RefObject<HTMLDivElement | null>) => {
  const lastWidth = useRef(0);
  const subscribe = useCallback(
    (onChange: () => void) => {
      const footer = footerRef.current;
      if (!footer) return () => undefined;
      if (typeof ResizeObserver === 'undefined') return subscribeWidthFallback(onChange);
      const observer = new ResizeObserver(onChange);
      observer.observe(footer);
      return () => observer.disconnect();
    },
    [footerRef]
  );
  const getWidth = () => {
    const next = footerRef.current?.clientWidth ?? 0;
    if (next > 0) lastWidth.current = next;
    return lastWidth.current;
  };
  return useSyncExternalStore(subscribe, getWidth, () => 0);
};

const RelationshipsTabFooter = () => {
  const { relationshipsEditMode: editMode, selectedRelationshipIds: selected } =
    useRelationshipsSelectionState();
  const highlighted = editMode && selected.size > 0;
  const footerRef = useRef<HTMLDivElement>(null);
  const width = useFooterWidth(footerRef);
  const compact = relationshipsFooterCompact(width);

  return (
    <EntityTabFooter
      highlighted={highlighted}
      padding={width >= RELATIONSHIPS_FOOTER_WIDE_AT ? 'px-4' : 'px-3'}
      ref={footerRef}
    >
      <RelationshipsActionBar compact={compact} />
    </EntityTabFooter>
  );
};

export { RelationshipsTabFooter, relationshipsFooterCompact };
