import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

const HYSTERESIS = 8;
const DEBOUNCE_MS = 150;

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const shouldShowCards = (containerWidth: number, tableWidth: number, showingCards: boolean) => {
  if (tableWidth > containerWidth) return true;
  return showingCards && tableWidth > containerWidth - HYSTERESIS;
};

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
  const [showCards, setShowCards] = useState(false);
  const showCardsRef = useRef(showCards);
  showCardsRef.current = showCards;

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!container || !probe) return undefined;

    const read = () => {
      const next = shouldShowCards(container.clientWidth, probe.scrollWidth, showCardsRef.current);
      setShowCards(current => (current === next ? current : next));
    };

    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const { observer, disconnect } = connectResizeObserver(read, DEBOUNCE_MS);
    observer.observe(container);
    observer.observe(probe);
    return disconnect;
  }, [containerRef, probeRef]);

  return showCards;
};

export { shouldShowCards, useTableFitsContainer };
