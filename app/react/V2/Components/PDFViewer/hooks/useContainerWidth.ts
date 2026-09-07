import { RefObject, useEffect, useLayoutEffect, useState } from 'react';

type Options = { borderWidth?: number; safetyBuffer?: number; debounce?: number };

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const availableWidth = (container: HTMLElement, borderWidth: number, safetyBuffer: number) =>
  Math.max(0, Math.floor(container.clientWidth - borderWidth * 2 - safetyBuffer));

const connectResizeObserver = (onResize: () => void, debounce: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(entries => {
    const [entry] = entries;
    if (!entry || !entry.contentRect) {
      return;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      onResize();
      timeoutId = null;
    }, debounce);
  });
  return {
    observer,
    disconnect: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      observer.disconnect();
    },
  };
};

type ObserveArgs = {
  container: HTMLElement;
  onWidth: (width: number) => void;
  borderWidth: number;
  safetyBuffer: number;
  debounce: number;
};

const observeContainerWidth = ({
  container,
  onWidth,
  borderWidth,
  safetyBuffer,
  debounce,
}: ObserveArgs) => {
  const readWidth = () => onWidth(availableWidth(container, borderWidth, safetyBuffer));
  readWidth();
  if (typeof ResizeObserver === 'undefined') {
    return undefined;
  }
  const { observer, disconnect } = connectResizeObserver(readWidth, debounce);
  observer.observe(container);
  return disconnect;
};

const useContainerWidth = (
  containerRef: RefObject<HTMLElement | null>,
  { borderWidth = 1, safetyBuffer = 2, debounce = 150 }: Options = {}
) => {
  const [width, setWidth] = useState<number | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    return observeContainerWidth({
      container,
      onWidth: next => {
        setWidth(current => (current === next ? current : next));
      },
      borderWidth,
      safetyBuffer,
      debounce,
    });
  }, [containerRef, borderWidth, safetyBuffer, debounce]);

  return width;
};

export { useContainerWidth };
