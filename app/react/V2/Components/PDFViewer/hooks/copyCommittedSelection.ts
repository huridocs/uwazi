import type { MutableRefObject } from 'react';
import type { WordHighlight } from './wordSelectionHandlers.js';

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
};

const committedTextToCopy = (
  event: KeyboardEvent,
  highlightRef: MutableRefObject<WordHighlight | undefined>
) => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'c') {
    return undefined;
  }
  if (isEditableTarget(event.target)) {
    return undefined;
  }
  if (window.getSelection()?.toString().trim()) {
    return undefined;
  }
  const text = highlightRef.current?.committed?.text?.trim();
  if (!text || !navigator.clipboard?.writeText) {
    return undefined;
  }
  return text;
};

const bindCommittedCopy = (highlightRef: MutableRefObject<WordHighlight | undefined>) => {
  const onKeyDown = (event: KeyboardEvent) => {
    const text = committedTextToCopy(event, highlightRef);
    if (!text) {
      return;
    }
    event.preventDefault();
    void navigator.clipboard.writeText(text);
  };

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
};

export { bindCommittedCopy };
