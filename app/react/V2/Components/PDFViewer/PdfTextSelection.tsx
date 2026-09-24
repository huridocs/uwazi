import React, { useEffect, useRef } from 'react';
import { HandleTextSelection, type TextSelection } from '@huridocs/react-text-selection-handler';

type PdfTextSelectionProps = {
  onSelect: (selection: TextSelection) => void;
  onDeselect?: () => void;
  children: React.ReactNode;
};

const selectionInside = (root: HTMLElement) => {
  const node = window.getSelection()?.anchorNode;
  return Boolean(node && root.contains(node));
};

const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

const SELECTION_SETTLE_MS = 200;

const PdfTextSelection = ({ onSelect, onDeselect, children }: PdfTextSelectionProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const touchSelection = useRef(false);

  useEffect(() => {
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
  }, []);

  return (
    <HandleTextSelection onSelect={onSelect} onDeselect={onDeselect}>
      <div
        ref={rootRef}
        onPointerDown={event => {
          touchSelection.current = event.pointerType === 'touch';
        }}
        onTouchStart={() => {
          touchSelection.current = true;
        }}
        onMouseDownCapture={event => {
          if (touchSelection.current || coarsePointer()) event.stopPropagation();
        }}
      >
        {children}
      </div>
    </HandleTextSelection>
  );
};

export { PdfTextSelection };
