/* eslint-disable react/require-default-props */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LinkIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { Translate } from '#app/I18N/index.js';
import { TextCursorInputStrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { copyThemeScopeStyle } from '#V2/theme/copyThemeScopeStyle.js';
import { getSelectionMenuPosition } from './getSelectionMenuPosition.js';
import { placeSelectionMenu } from './placeSelectionMenu.js';

const actionClass =
  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-parchment transition-colors hover:bg-white/15';

const mutedActionClass =
  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-parchment';

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
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = menuRef.current;
    if (!node) return;
    const { width, height } = node.getBoundingClientRect();
    setMenuSize(prev =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, [selection, armedLabel]);

  const position = getSelectionMenuPosition(selection);
  if (!position || typeof document === 'undefined') return null;

  const { left, top } = placeSelectionMenu(position, menuSize, {
    width: position.host.clientWidth,
    height: position.host.clientHeight,
  });

  const themeStyle = copyThemeScopeStyle(scrollRoot || position.host);

  return createPortal(
    <div
      ref={menuRef}
      className="tw-content tw-content--chrome"
      style={{
        position: 'absolute',
        left,
        top,
        display: 'inline-flex',
        zIndex: 50,
        ...themeStyle,
      }}
      data-testid="document-selection-floating-menu"
    >
      <div className="flex items-center gap-0.5 rounded-md bg-ink px-1 py-1 shadow-xl">
        {armedLabel ? (
          <>
            <button
              type="button"
              onClick={onFillFromSelection}
              className={actionClass}
              data-testid="fill-from-selection"
            >
              <Translate>Fill</Translate> {armedLabel}
              <TextCursorInputStrokeIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
            <div className="h-4 w-px bg-white/20" aria-hidden="true" />
          </>
        ) : null}
        <button type="button" onClick={onCreateRelationship} className={actionClass}>
          <LinkIcon className="h-3.5 w-3.5" aria-hidden />
          <Translate>Create relationship</Translate>
        </button>
        <div className="h-4 w-px bg-white/20" aria-hidden="true" />
        <button type="button" onClick={onAddToToC} className={mutedActionClass}>
          <ListBulletIcon className="h-3.5 w-3.5" aria-hidden />
          <Translate>Add to ToC</Translate>
        </button>
      </div>
    </div>,
    position.host
  );
};

export { DocumentSelectionFloatingMenu };
