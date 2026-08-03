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
const FOCUS_RETRY_MS = 100;
const FOCUS_DEADLINE_MS = 1100;

/**
 * Find `[data-field-key]`, flash, and re-scroll until deadline (map/layout settle).
 * Returns cleanup; missing keys keep retrying until deadline without throwing.
 */
const applyMetadataFieldFocus = (
  getRoot: () => ParentNode | null,
  fieldKey: string
): (() => void) => {
  let cancelled = false;
  let flashedEl: HTMLElement | null = null;
  const timers: number[] = [];
  const deadline = Date.now() + FOCUS_DEADLINE_MS;

  const attempt = () => {
    if (cancelled) return;
    const root = getRoot();
    const el = root?.querySelector<HTMLElement>(`[data-field-key="${CSS.escape(fieldKey)}"]`);
    if (el) {
      scrollIntoView(el, { behavior: 'auto', block: 'center' });
      if (!flashedEl) {
        flashedEl = el;
        el.classList.add('flash-highlight');
        timers.push(
          window.setTimeout(() => {
            el.classList.remove('flash-highlight');
          }, FLASH_MS)
        );
      }
    }
    if (Date.now() < deadline) {
      timers.push(window.setTimeout(attempt, FOCUS_RETRY_MS));
    }
  };

  attempt();
  return () => {
    cancelled = true;
    timers.forEach(t => window.clearTimeout(t));
  };
};

export { focusMetadataFieldAtom, esFieldToFocusKey, applyMetadataFieldFocus, FLASH_MS };
export type { FocusMetadataField };
