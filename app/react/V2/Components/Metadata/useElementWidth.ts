import { RefObject, useEffect, useLayoutEffect, useState } from 'react';

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const readClientWidth = (el: HTMLElement) => Math.max(0, Math.floor(el.clientWidth));

const connectResizeObserver = (
  el: HTMLElement,
  onWidth: (width: number) => void,
  debounceMs: number
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      onWidth(readClientWidth(el));
      timeoutId = null;
    }, debounceMs);
  });
  observer.observe(el);
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    observer.disconnect();
  };
};

const observeElementWidth = (
  el: HTMLElement,
  onWidth: (width: number) => void,
  debounceMs: number
) => {
  onWidth(readClientWidth(el));
  if (typeof ResizeObserver === 'undefined') {
    return undefined;
  }
  return connectResizeObserver(el, onWidth, debounceMs);
};

const useElementWidth = (ref: RefObject<HTMLElement | null>, debounceMs = 50) => {
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return undefined;
    }
    return observeElementWidth(el, setWidth, debounceMs);
  }, [ref, debounceMs]);

  return width;
};

export { useElementWidth };
