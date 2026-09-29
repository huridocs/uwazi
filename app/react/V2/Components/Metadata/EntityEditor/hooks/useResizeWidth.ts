import { useCallback, useRef } from 'react';

const useResizeWidth = (onWidth: (width: number) => void) => {
  const observerRef = useRef<ResizeObserver | null>(null);
  return useCallback(
    (element: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!element) return;
      const measure = () => onWidth(element.getBoundingClientRect().width);
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      observerRef.current = observer;
    },
    [onWidth]
  );
};

export { useResizeWidth };
