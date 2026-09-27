import { type RefObject, useCallback, useEffect, useRef } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { collectPdfWords, type PdfWord } from '../functions/wordSelection.js';
import {
  bindWordSelectionListeners,
  releaseWordSelection,
  type WordHighlight,
} from './wordSelectionHandlers.js';

type UseWordSelectionArgs = {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onSelect: (selection: TextSelection) => void;
  onDeselect?: () => void;
  onHighlightChange?: (highlight: WordHighlight | undefined) => void;
};

const useLatest = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

const useWordSelection = ({
  enabled,
  containerRef,
  onSelect,
  onDeselect,
  onHighlightChange,
}: UseWordSelectionArgs) => {
  const startIndexRef = useRef<number | null>(null);
  const highlightRef = useRef<WordHighlight | undefined>();
  const wordsRef = useRef<PdfWord[]>([]);
  const onSelectRef = useLatest(onSelect);
  const onDeselectRef = useLatest(onDeselect);
  const onHighlightChangeRef = useLatest(onHighlightChange);

  const notifyHighlight = useCallback(
    (highlight: WordHighlight | undefined) => {
      onHighlightChangeRef.current?.(highlight);
    },
    [onHighlightChangeRef]
  );

  const clearSelection = useCallback(() => {
    if (startIndexRef.current === null && !highlightRef.current) {
      return;
    }
    releaseWordSelection(startIndexRef, highlightRef, notifyHighlight);
    onDeselectRef.current?.();
  }, [notifyHighlight, onDeselectRef]);

  useEffect(() => {
    if (!enabled) {
      releaseWordSelection(startIndexRef, highlightRef, notifyHighlight);
      return undefined;
    }

    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    return bindWordSelectionListeners({
      root,
      startIndexRef,
      highlightRef,
      wordsRef,
      collectWords: collectPdfWords,
      onSelect: selection => onSelectRef.current(selection),
      onDeselect: () => onDeselectRef.current?.(),
      onHighlightChange: notifyHighlight,
    });
  }, [containerRef, enabled, notifyHighlight, onSelectRef, onDeselectRef]);

  return { clearSelection };
};

export type { UseWordSelectionArgs, WordHighlight };
export { useWordSelection };
