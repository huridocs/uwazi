import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';

const TABLE_MIN_PX = 28.5 * 16;
const COMPACT_CELL_PX = 72;
const DEBOUNCE_MS = 150;

type ConnectionLayout = 'table' | 'stack' | 'properties';

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const connectionLayout = (
  containerWidth: number,
  tableWidth: number,
  tallestCell: number
): ConnectionLayout => {
  if (containerWidth <= 0) return 'table';
  if (containerWidth < TABLE_MIN_PX) return 'stack';
  if (tallestCell > COMPACT_CELL_PX || tableWidth > containerWidth + 1) return 'properties';
  return 'table';
};

const tallestCellHeight = (probe: HTMLElement) =>
  [...probe.querySelectorAll('[data-measure-cell]')].reduce(
    (tallest, cell) => Math.max(tallest, cell.getBoundingClientRect().height),
    0
  );

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

const useTableFitsContainer = (
  containerRef: RefObject<HTMLElement | null>,
  probeRef: RefObject<HTMLElement | null>
) => {
  const [layout, setLayout] = useState<ConnectionLayout>('table');

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!container || !probe) return undefined;

    const read = () => {
      const next = connectionLayout(
        container.clientWidth,
        probe.scrollWidth,
        tallestCellHeight(probe)
      );
      setLayout(current => (current === next ? current : next));
    };

    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const { observer, disconnect } = connectResizeObserver(read, DEBOUNCE_MS);
    observer.observe(container);
    observer.observe(probe);
    return disconnect;
  }, [containerRef, probeRef]);

  return layout;
};

export { connectionLayout, useTableFitsContainer };
