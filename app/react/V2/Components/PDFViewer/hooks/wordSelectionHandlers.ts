import type { MutableRefObject } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import {
  bindWordLayoutInvalidation,
  createWordLayoutCache,
  findWordAtPointInLayout,
  selectionFromLayout,
  type CollectWords,
  type WordLayout,
} from '../functions/wordSelectionLayout.js';
import type { PdfWord } from '../functions/wordSelection.js';
import { createPointerFrame } from './pointerFrame.js';

type WordHighlight = {
  preview?: TextSelection;
  committed?: TextSelection;
};

type WordSelectionHandlersArgs = {
  root: HTMLElement;
  startIndexRef: MutableRefObject<number | null>;
  highlightRef: MutableRefObject<WordHighlight | undefined>;
  wordsRef: MutableRefObject<PdfWord[]>;
  collectWords: CollectWords;
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

type HoverState = { index: number | null };

type PointerHandlerArgs = {
  startIndexRef: MutableRefObject<number | null>;
  lastHover: HoverState;
  locateWord: (event: MouseEvent) => number;
  startOrCommit: (wordIndex: number) => void;
  cancelIfSelecting: () => void;
  paintHover: (wordIndex: number) => void;
  clearHover: () => void;
};

const createPointerHandlers = ({
  startIndexRef,
  lastHover,
  locateWord,
  startOrCommit,
  cancelIfSelecting,
  paintHover,
  clearHover,
}: PointerHandlerArgs) => {
  const handleClick = (event: MouseEvent) => {
    const wordIndex = locateWord(event);
    if (wordIndex < 0) {
      cancelIfSelecting();
      return;
    }
    startOrCommit(wordIndex);
  };

  const handleMouseMove = (event: MouseEvent) => {
    const wordIndex = locateWord(event);
    if (wordIndex < 0) {
      if (startIndexRef.current === null) {
        clearHover();
      }
      return;
    }
    if (lastHover.index === wordIndex) {
      return;
    }
    paintHover(wordIndex);
  };

  return { handleClick, handleMouseMove };
};

const createWordSelectionHandlers = ({
  startIndexRef,
  highlightRef,
  getLayout,
  onSelect,
  onDeselect,
  onHighlightChange,
}: WordSelectionHandlersArgs & { getLayout: () => WordLayout }) => {
  const lastHover: HoverState = { index: null };
  const { publish, publishPreview } = createHighlightPublisher(highlightRef, onHighlightChange);

  const selectionFor = (startIndex: number, endIndex: number) =>
    selectionFromLayout(getLayout(), startIndex, endIndex);

  const cancelIfSelecting = () => {
    if (startIndexRef.current === null) {
      return;
    }
    startIndexRef.current = null;
    lastHover.index = null;
    publishPreview(undefined);
    if (!highlightRef.current?.committed) {
      onDeselect();
    }
  };

  const beginRange = (wordIndex: number) => {
    startIndexRef.current = wordIndex;
    if (lastHover.index !== wordIndex) {
      publishPreview(selectionFor(wordIndex, wordIndex));
    }
    lastHover.index = wordIndex;
  };

  const commitRange = (wordIndex: number) => {
    const selection = selectionFor(startIndexRef.current as number, wordIndex);
    startIndexRef.current = null;
    lastHover.index = null;
    publish({ committed: selection });
    onSelect(selection);
  };

  const startOrCommit = (wordIndex: number) => {
    if (startIndexRef.current === null) {
      beginRange(wordIndex);
      return;
    }
    commitRange(wordIndex);
  };

  const paintHover = (wordIndex: number) => {
    lastHover.index = wordIndex;
    if (startIndexRef.current !== null) {
      publishPreview(selectionFor(startIndexRef.current, wordIndex));
      return;
    }
    publishPreview(selectionFor(wordIndex, wordIndex));
  };

  const clearHover = () => {
    if (lastHover.index === null) {
      return;
    }
    lastHover.index = null;
    publishPreview(undefined);
  };

  return {
    ...createPointerHandlers({
      startIndexRef,
      lastHover,
      locateWord: event => findWordAtPointInLayout(getLayout(), event.clientX, event.clientY),
      startOrCommit,
      cancelIfSelecting,
      paintHover,
      clearHover,
    }),
    clearHighlight: () => {
      startIndexRef.current = null;
      lastHover.index = null;
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

const bindPointer = (
  root: HTMLElement,
  frame: ReturnType<typeof createPointerFrame>,
  handlers: {
    handleClick: (event: MouseEvent) => void;
    handleMouseMove: (event: MouseEvent) => void;
  }
) => {
  const onMove = (event: MouseEvent) => {
    frame.schedule(() => handlers.handleMouseMove(event));
  };
  const onClick = (event: MouseEvent) => {
    frame.cancel();
    handlers.handleClick(event);
  };
  root.addEventListener('click', onClick);
  root.addEventListener('mousemove', onMove);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('mousemove', onMove);
  };
};

const bindWordSelectionListeners = (args: WordSelectionHandlersArgs) => {
  const { root, startIndexRef, highlightRef, wordsRef, collectWords, onHighlightChange } = args;
  const cache = createWordLayoutCache(root, collectWords);
  const frame = createPointerFrame();
  const handlers = createWordSelectionHandlers({
    ...args,
    getLayout: () => {
      const layout = cache.get();
      wordsRef.current = layout.words;
      return layout;
    },
  });
  const unbindPointer = bindPointer(root, frame, handlers);
  const unbindInvalidation = bindWordLayoutInvalidation(root, cache.invalidate);

  return () => {
    unbindPointer();
    unbindInvalidation();
    frame.cancel();
    releaseWordSelection(startIndexRef, highlightRef, onHighlightChange);
  };
};

export type { WordHighlight, WordSelectionHandlersArgs };
export { createWordSelectionHandlers, bindWordSelectionListeners, releaseWordSelection };
