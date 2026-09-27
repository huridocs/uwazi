import React, { useEffect, useRef } from 'react';
import { HandleTextSelection, type TextSelection } from '@huridocs/react-text-selection-handler';

type PdfTextSelectionProps = {
  onSelect: (selection: TextSelection) => void;
  onDeselect?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

const selectionInside = (root: HTMLElement) => {
  const node = window.getSelection()?.anchorNode;
  return Boolean(node && root.contains(node));
};

const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

const SELECTION_SETTLE_MS = 200;
const noop = () => undefined;

const PdfTextSelection = ({
  onSelect,
  onDeselect,
  disabled = false,
  children,
}: PdfTextSelectionProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const touchSelection = useRef(false);

  useEffect(() => {
    if (disabled) {
      return undefined;
    }
    let settleTimer: number | undefined;
    const reportSettledSelection = () => {
      if (!touchSelection.current && !coarsePointer()) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const root = rootRef.current;
        if (!root || !selectionInside(root)) return;
        root.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
      }, SELECTION_SETTLE_MS);
    };
    document.addEventListener('selectionchange', reportSettledSelection);
    return () => {
      window.clearTimeout(settleTimer);
      document.removeEventListener('selectionchange', reportSettledSelection);
    };
  }, [disabled]);

  const content = (
    <div
      ref={rootRef}
      onPointerDown={event => {
        if (disabled) return;
        touchSelection.current = event.pointerType === 'touch';
      }}
      onTouchStart={() => {
        if (disabled) return;
        touchSelection.current = true;
      }}
      onMouseDownCapture={event => {
        if (disabled) return;
        if (touchSelection.current || coarsePointer()) event.stopPropagation();
      }}
    >
      {children}
    </div>
  );

  return (
    <HandleTextSelection
      onSelect={disabled ? noop : onSelect}
      onDeselect={disabled ? noop : onDeselect}
    >
      {content}
    </HandleTextSelection>
  );
};

export { PdfTextSelection };
