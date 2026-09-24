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

const PdfTextSelection = ({ onSelect, onDeselect, children }: PdfTextSelectionProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const touchSelection = useRef(false);

  useEffect(() => {
    const reportTouchSelection = () => {
      const root = rootRef.current;
      if ((!touchSelection.current && !coarsePointer()) || !root || !selectionInside(root)) return;
      root.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    };
    document.addEventListener('selectionchange', reportTouchSelection);
    return () => document.removeEventListener('selectionchange', reportTouchSelection);
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
