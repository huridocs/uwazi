import React, { useEffect, useState } from 'react';
import { LinkIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { Translate } from '#app/I18N/index.js';
import { getSelectionMenuPosition } from './getSelectionMenuPosition.js';

type DocumentSelectionFloatingMenuProps = {
  selection: TextSelection;
  onCreateRelationship: () => void;
  onAddToToC: () => void;
};

const DocumentSelectionFloatingMenu = ({
  selection,
  onCreateRelationship,
  onAddToToC,
}: DocumentSelectionFloatingMenuProps) => {
  const [, setLayoutTick] = useState(0);

  useEffect(() => {
    const container = document.querySelector('[data-testid="pdf-scroll-container"]');
    const bump = () => setLayoutTick(tick => tick + 1);
    container?.addEventListener('scroll', bump, { passive: true });
    window.addEventListener('resize', bump);
    return () => {
      container?.removeEventListener('scroll', bump);
      window.removeEventListener('resize', bump);
    };
  }, []);

  const position = getSelectionMenuPosition(selection);
  if (!position) return null;

  const clampedX =
    typeof window !== 'undefined'
      ? Math.min(Math.max(position.x, 110), window.innerWidth - 110)
      : position.x;

  return (
    <div
      className="fixed z-50"
      style={{
        left: clampedX,
        top: Math.max(8, position.y - 48),
        transform: 'translateX(-50%)',
      }}
      data-testid="document-selection-floating-menu"
    >
      <div className="flex items-center gap-0.5 rounded-md bg-[#1A1A1A] px-1 py-1 shadow-xl">
        <button
          type="button"
          onClick={onCreateRelationship}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          <Translate>Create relationship</Translate>
        </button>
        <div className="h-4 w-px bg-white/20" aria-hidden="true" />
        <button
          type="button"
          onClick={onAddToToC}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <ListBulletIcon className="h-3.5 w-3.5" />
          <Translate>Add to ToC</Translate>
        </button>
      </div>
    </div>
  );
};

export { DocumentSelectionFloatingMenu };
