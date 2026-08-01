import { atom } from 'jotai';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';

type FocusMetadataField = {
  fieldKey: string;
};

const focusMetadataFieldAtom = atom<FocusMetadataField | null>(null);

/** ES highlight fields are `title` or `metadata.<name>.(value|label)`; DOM uses property name only. */
const esFieldToFocusKey = (field: string): string => {
  if (field === 'title' || field.startsWith('title.')) return 'title';
  if (field.startsWith('metadata.')) {
    return field.slice('metadata.'.length).split('.')[0] || field;
  }
  return field.split('.')[0] || field;
};

const FLASH_MS = 1100;
const SCROLL_RETRY_INTERVAL_MS = 100;
const SCROLL_RETRY_COUNT = 6;

/**
 * Scroll/flash a `[data-field-key]` target under root.
 * Missing keys are a safe no-op for the caller.
 * Re-scrolls instantly while layout settles (e.g. geolocation map mount above target).
 */
const applyMetadataFieldFocus = (root: ParentNode, fieldKey: string): (() => void) | null => {
  const el = root.querySelector<HTMLElement>(`[data-field-key="${CSS.escape(fieldKey)}"]`);
  if (!el) return null;

  const scrollToTarget = () => {
    scrollIntoView(el, { behavior: 'auto', block: 'center' });
  };

  scrollToTarget();
  el.classList.add('flash-highlight');

  const timers: number[] = [
    window.setTimeout(() => el.classList.remove('flash-highlight'), FLASH_MS),
  ];
  for (let i = 1; i <= SCROLL_RETRY_COUNT; i += 1) {
    timers.push(window.setTimeout(scrollToTarget, i * SCROLL_RETRY_INTERVAL_MS));
  }

  return () => timers.forEach(t => window.clearTimeout(t));
};

export { focusMetadataFieldAtom, esFieldToFocusKey, applyMetadataFieldFocus, FLASH_MS };
export type { FocusMetadataField };
