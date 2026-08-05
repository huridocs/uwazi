import { useCallback, useEffect, useState } from 'react';

const RAIL_WIDTH = 32;

const useRailInset = (pdfScrollRoot: HTMLElement | null, enabled: boolean) => {
  const [railInsetRight, setRailInsetRight] = useState<number | undefined>();

  const measureRailInset = useCallback(() => {
    const container = pdfScrollRoot?.querySelector<HTMLElement>('#pdf-container');
    if (!pdfScrollRoot || !container) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width <= 0) {
      return;
    }
    const gutter = pdfScrollRoot.getBoundingClientRect().right - containerRect.right;
    setRailInsetRight(Math.max(0, Math.round(gutter / 2 - RAIL_WIDTH / 2)));
  }, [pdfScrollRoot]);

  useEffect(() => {
    if (!enabled || !pdfScrollRoot) {
      return undefined;
    }
    measureRailInset();
    const observer = new ResizeObserver(measureRailInset);
    observer.observe(pdfScrollRoot);
    return () => {
      observer.disconnect();
    };
  }, [enabled, pdfScrollRoot, measureRailInset]);

  return { railInsetRight, measureRailInset };
};

export { useRailInset };
