import { RefObject, useEffect, useState } from 'react';

type Options = { borderWidth?: number; safetyBuffer?: number; debounce?: number };

const useContainerWidth = (
  containerRef: RefObject<HTMLElement | null>,
  { borderWidth = 1, safetyBuffer = 2, debounce = 150 }: Options = {}
) => {
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const getAvailableWidth = () =>
      Math.max(0, Math.floor(container.clientWidth - borderWidth * 2 - safetyBuffer));

    setWidth(getAvailableWidth());

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver(entries => {
      const [entry] = entries;
      if (entry && entry.contentRect) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          setWidth(getAvailableWidth());
          timeoutId = null;
        }, debounce);
      }
    });

    observer.observe(container);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      observer.disconnect();
    };
  }, [containerRef, borderWidth, safetyBuffer, debounce]);

  return width;
};

export { useContainerWidth };
