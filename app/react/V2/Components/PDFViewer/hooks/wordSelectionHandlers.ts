import type { MutableRefObject } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import {
  findWordAtPoint,
  selectionFromWordRange,
  type PdfWord,
} from '../functions/wordSelection.js';

type WordSelectionHandlersArgs = {
  root: HTMLElement;
  startIndexRef: MutableRefObject<number | null>;
  wordsRef: MutableRefObject<PdfWord[]>;
  collectWords: (root: HTMLElement) => PdfWord[];
  onSelect: (selection: TextSelection) => void;
  onDeselect: () => void;
  onPreviewChange: (selection: TextSelection | undefined) => void;
};

const createWordSelectionHandlers = ({
  root,
  startIndexRef,
  wordsRef,
  collectWords,
  onSelect,
  onDeselect,
  onPreviewChange,
}: WordSelectionHandlersArgs) => {
  const refreshWords = () => {
    wordsRef.current = collectWords(root);
  };

  const clearPreview = () => {
    startIndexRef.current = null;
    onPreviewChange(undefined);
  };

  const previewTo = (endIndex: number) => {
    const startIndex = startIndexRef.current;
    if (startIndex === null) {
      return;
    }
    onPreviewChange(
      selectionFromWordRange({ words: wordsRef.current, startIndex, endIndex, root })
    );
  };

  const cancelIfSelecting = () => {
    if (startIndexRef.current === null) {
      return;
    }
    clearPreview();
    onDeselect();
  };

  const startOrCommit = (wordIndex: number) => {
    if (startIndexRef.current === null) {
      startIndexRef.current = wordIndex;
      previewTo(wordIndex);
      return;
    }

    const selection = selectionFromWordRange({
      words: wordsRef.current,
      startIndex: startIndexRef.current,
      endIndex: wordIndex,
      root,
    });
    clearPreview();
    onSelect(selection);
  };

  const handleClick = (event: MouseEvent) => {
    refreshWords();
    const wordIndex = findWordAtPoint(wordsRef.current, event.clientX, event.clientY);
    if (wordIndex < 0) {
      cancelIfSelecting();
      return;
    }
    startOrCommit(wordIndex);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (startIndexRef.current === null) {
      return;
    }
    refreshWords();
    const wordIndex = findWordAtPoint(wordsRef.current, event.clientX, event.clientY);
    if (wordIndex >= 0) {
      previewTo(wordIndex);
    }
  };

  return { handleClick, handleMouseMove };
};

const bindWordSelectionListeners = (args: WordSelectionHandlersArgs) => {
  const { root, startIndexRef, onPreviewChange } = args;
  const { handleClick, handleMouseMove } = createWordSelectionHandlers(args);
  root.addEventListener('click', handleClick);
  root.addEventListener('mousemove', handleMouseMove);
  return () => {
    root.removeEventListener('click', handleClick);
    root.removeEventListener('mousemove', handleMouseMove);
    if (startIndexRef.current !== null) {
      startIndexRef.current = null;
      onPreviewChange(undefined);
    }
  };
};

const releaseWordSelection = (
  startIndexRef: MutableRefObject<number | null>,
  onPreviewChange: (selection: TextSelection | undefined) => void
) => {
  if (startIndexRef.current === null) {
    return;
  }
  startIndexRef.current = null;
  onPreviewChange(undefined);
};

export type { WordSelectionHandlersArgs };
export { createWordSelectionHandlers, bindWordSelectionListeners, releaseWordSelection };
