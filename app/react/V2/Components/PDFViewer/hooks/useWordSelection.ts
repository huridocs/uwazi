import { type RefObject, useEffect, useRef } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { collectPdfWords, type PdfWord } from '../functions/wordSelection.js';
import { bindWordSelectionListeners, releaseWordSelection } from './wordSelectionHandlers.js';

type UseWordSelectionArgs = {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onSelect: (selection: TextSelection) => void;
  onDeselect?: () => void;
  onPreviewChange?: (selection: TextSelection | undefined) => void;
};

const useWordSelection = ({
  enabled,
  containerRef,
  onSelect,
  onDeselect,
  onPreviewChange,
}: UseWordSelectionArgs) => {
  const startIndexRef = useRef<number | null>(null);
  const wordsRef = useRef<PdfWord[]>([]);
  const onSelectRef = useRef(onSelect);
  const onDeselectRef = useRef(onDeselect);
  const onPreviewChangeRef = useRef(onPreviewChange);

  onSelectRef.current = onSelect;
  onDeselectRef.current = onDeselect;
  onPreviewChangeRef.current = onPreviewChange;

  useEffect(() => {
    const notifyPreview = (selection: TextSelection | undefined) =>
      onPreviewChangeRef.current?.(selection);

    if (!enabled) {
      releaseWordSelection(startIndexRef, notifyPreview);
      return undefined;
    }

    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    return bindWordSelectionListeners({
      root,
      startIndexRef,
      wordsRef,
      collectWords: collectPdfWords,
      onSelect: selection => onSelectRef.current(selection),
      onDeselect: () => onDeselectRef.current?.(),
      onPreviewChange: notifyPreview,
    });
  }, [containerRef, enabled]);
};

export type { UseWordSelectionArgs };
export { useWordSelection };
