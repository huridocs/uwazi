import type { MutableRefObject } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import {
  findWordAtPoint,
  selectionFromWordRange,
  type PdfWord,
} from '../functions/wordSelection.js';

type WordHighlight = {
  preview?: TextSelection;
  committed?: TextSelection;
};

type WordSelectionHandlersArgs = {
  root: HTMLElement;
  startIndexRef: MutableRefObject<number | null>;
  highlightRef: MutableRefObject<WordHighlight | undefined>;
  wordsRef: MutableRefObject<PdfWord[]>;
  collectWords: (root: HTMLElement) => PdfWord[];
  onSelect: (selection: TextSelection) => void;
  onDeselect: () => void;
  onHighlightChange: (highlight: WordHighlight | undefined) => void;
};

const compactHighlight = (highlight: WordHighlight): WordHighlight | undefined => {
  if (!highlight.preview && !highlight.committed) {
    return undefined;
  }
  return highlight;
};

const createHighlightPublisher = (
  highlightRef: MutableRefObject<WordHighlight | undefined>,
  onHighlightChange: (highlight: WordHighlight | undefined) => void
) => {
  const publish = (highlight: WordHighlight | undefined) => {
    const next = highlight ? compactHighlight(highlight) : undefined;
    highlightRef.current = next;
    onHighlightChange(next);
  };

  const publishPreview = (preview?: TextSelection) => {
    publish({ preview, committed: highlightRef.current?.committed });
  };

  return { publish, publishPreview };
};

type PointerHandlerArgs = {
  wordsRef: MutableRefObject<PdfWord[]>;
  startIndexRef: MutableRefObject<number | null>;
  refreshWords: () => void;
  startOrCommit: (wordIndex: number) => void;
  cancelIfSelecting: () => void;
  paintHover: (wordIndex: number) => void;
  clearHover: () => void;
};

const createPointerHandlers = ({
  wordsRef,
  startIndexRef,
  refreshWords,
  startOrCommit,
  cancelIfSelecting,
  paintHover,
  clearHover,
}: PointerHandlerArgs) => {
  const wordAtEvent = (event: MouseEvent) => {
    refreshWords();
    return findWordAtPoint(wordsRef.current, event.clientX, event.clientY);
  };

  const handleClick = (event: MouseEvent) => {
    const wordIndex = wordAtEvent(event);
    if (wordIndex < 0) {
      cancelIfSelecting();
      return;
    }
    startOrCommit(wordIndex);
  };

  const handleMouseMove = (event: MouseEvent) => {
    const wordIndex = wordAtEvent(event);
    if (wordIndex < 0) {
      if (startIndexRef.current === null) {
        clearHover();
      }
      return;
    }
    paintHover(wordIndex);
  };

  return { handleClick, handleMouseMove };
};

const createWordSelectionHandlers = ({
  root,
  startIndexRef,
  highlightRef,
  wordsRef,
  collectWords,
  onSelect,
  onDeselect,
  onHighlightChange,
}: WordSelectionHandlersArgs) => {
  const refreshWords = () => {
    wordsRef.current = collectWords(root);
  };

  const { publish, publishPreview } = createHighlightPublisher(highlightRef, onHighlightChange);

  const selectionFor = (startIndex: number, endIndex: number) =>
    selectionFromWordRange({
      words: wordsRef.current,
      startIndex,
      endIndex,
      root,
    });

  const cancelIfSelecting = () => {
    if (startIndexRef.current === null) {
      return;
    }
    startIndexRef.current = null;
    publishPreview(undefined);
    if (!highlightRef.current?.committed) {
      onDeselect();
    }
  };

  const startOrCommit = (wordIndex: number) => {
    if (startIndexRef.current === null) {
      startIndexRef.current = wordIndex;
      publishPreview(selectionFor(wordIndex, wordIndex));
      return;
    }

    const selection = selectionFor(startIndexRef.current, wordIndex);
    startIndexRef.current = null;
    publish({ committed: selection });
    onSelect(selection);
  };

  const paintHover = (wordIndex: number) => {
    if (startIndexRef.current !== null) {
      publishPreview(selectionFor(startIndexRef.current, wordIndex));
      return;
    }
    publishPreview(selectionFor(wordIndex, wordIndex));
  };

  return {
    ...createPointerHandlers({
      wordsRef,
      startIndexRef,
      refreshWords,
      startOrCommit,
      cancelIfSelecting,
      paintHover,
      clearHover: () => publishPreview(undefined),
    }),
    clearHighlight: () => {
      startIndexRef.current = null;
      publish(undefined);
    },
  };
};

const releaseWordSelection = (
  startIndexRef: MutableRefObject<number | null>,
  highlightRef: MutableRefObject<WordHighlight | undefined>,
  onHighlightChange: (highlight: WordHighlight | undefined) => void
) => {
  const hadHighlight = startIndexRef.current !== null || Boolean(highlightRef.current);
  startIndexRef.current = null;
  highlightRef.current = undefined;
  if (hadHighlight) {
    onHighlightChange(undefined);
  }
};

const bindWordSelectionListeners = (args: WordSelectionHandlersArgs) => {
  const { root, startIndexRef, highlightRef, onHighlightChange } = args;
  const { handleClick, handleMouseMove } = createWordSelectionHandlers(args);
  root.addEventListener('click', handleClick);
  root.addEventListener('mousemove', handleMouseMove);
  return () => {
    root.removeEventListener('click', handleClick);
    root.removeEventListener('mousemove', handleMouseMove);
    releaseWordSelection(startIndexRef, highlightRef, onHighlightChange);
  };
};

export type { WordHighlight, WordSelectionHandlersArgs };
export { createWordSelectionHandlers, bindWordSelectionListeners, releaseWordSelection };
