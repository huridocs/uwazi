import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';

const TABLE_MIN_PX = 28.5 * 16;
const DEBOUNCE_MS = 150;

type ConnectionLayout = 'table' | 'stack';

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const connectionLayout = (containerWidth: number): ConnectionLayout =>
  containerWidth > 0 && containerWidth < TABLE_MIN_PX ? 'stack' : 'table';

const connectResizeObserver = (onResize: () => void, debounce: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      onResize();
      timeoutId = null;
    }, debounce);
  });
  return {
    observer,
    disconnect: () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    },
  };
};

const useTableFitsContainer = (containerRef: RefObject<HTMLElement | null>) => {
  const [layout, setLayout] = useState<ConnectionLayout>('table');

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const read = () => {
      const next = connectionLayout(container.clientWidth);
      setLayout(current => (current === next ? current : next));
    };

    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const { observer, disconnect } = connectResizeObserver(read, DEBOUNCE_MS);
    observer.observe(container);
    return disconnect;
  }, [containerRef]);

  return layout;
};

export { connectionLayout, useTableFitsContainer };
