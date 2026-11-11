import React, { useLayoutEffect, useRef, useState } from 'react';
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

const RelationshipsTabFooter = () => {
  const { relationshipsEditMode: editMode, selectedRelationshipIds: selected } =
    useRelationshipsSelectionState();
  const highlighted = editMode && selected.size > 0;
  const footerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const compact = relationshipsFooterCompact(width);

  useLayoutEffect(() => {
    const footer = footerRef.current;
    if (!footer) return undefined;
    const read = () => setWidth(footer.clientWidth);
    read();
    if (typeof ResizeObserver === 'undefined') return subscribeWidthFallback(read);
    const observer = new ResizeObserver(read);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <EntityTabFooter
      highlighted={highlighted}
      padding={width >= RELATIONSHIPS_FOOTER_WIDE_AT ? 'px-4' : 'px-3'}
      ref={footerRef}
    >
      {width > 0 ? <RelationshipsActionBar compact={compact} /> : null}
    </EntityTabFooter>
  );
};

export { RelationshipsTabFooter, relationshipsFooterCompact };
