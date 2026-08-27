/* eslint-disable react/require-default-props */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LinkIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { Translate } from '#app/I18N/index.js';
import { TextCursorInputStrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { getSelectionMenuPosition } from './getSelectionMenuPosition.js';
import { placeSelectionMenu } from './placeSelectionMenu.js';

type DocumentSelectionFloatingMenuProps = {
  selection: TextSelection;
  onCreateRelationship: () => void;
  onAddToToC: () => void;
  armedLabel?: string;
  onFillFromSelection?: () => void;
  scrollRoot?: HTMLElement | null;
};

const DocumentSelectionFloatingMenu = ({
  selection,
  onCreateRelationship,
  onAddToToC,
  armedLabel,
  onFillFromSelection,
  scrollRoot,
}: DocumentSelectionFloatingMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [layoutTick, setLayoutTick] = useState(0);
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let frame = 0;
    const bump = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setLayoutTick(tick => tick + 1));
    };
    scrollRoot?.addEventListener('scroll', bump, { passive: true });
    window.addEventListener('resize', bump);
    return () => {
      cancelAnimationFrame(frame);
      scrollRoot?.removeEventListener('scroll', bump);
      window.removeEventListener('resize', bump);
    };
  }, [scrollRoot]);

  useLayoutEffect(() => {
    const node = menuRef.current;
    if (!node) return;
    const { width, height } = node.getBoundingClientRect();
    setMenuSize(prev =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, [selection, armedLabel, layoutTick]);

  const position = getSelectionMenuPosition(selection);
  if (!position || typeof document === 'undefined') return null;

  const { left, top } = placeSelectionMenu(position, menuSize, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  return createPortal(
    <div
      ref={menuRef}
      className="tw-content tw-content--chrome"
      style={{
        position: 'fixed',
        left,
        top,
        display: 'inline-flex',
        zIndex: 50,
      }}
      data-testid="document-selection-floating-menu"
    >
      <div className="flex items-center gap-0.5 rounded-md bg-[#1A1A1A] px-1 py-1 shadow-xl">
        {armedLabel ? (
          <>
            <button
              type="button"
              onClick={onFillFromSelection}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
              data-testid="fill-from-selection"
            >
              <Translate>Fill</Translate> {armedLabel}
              <TextCursorInputStrokeIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
            <div className="h-4 w-px bg-white/20" aria-hidden="true" />
          </>
        ) : null}
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
    </div>,
    document.body
  );
};

export { DocumentSelectionFloatingMenu };
