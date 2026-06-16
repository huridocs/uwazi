import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { captureException } from '@sentry/react';
import { isClient } from '#app/utils/index.js';
import { PaneLayoutProps } from './types.js';

const MIN_WIDTH = 100;
const SEPARATOR_PX = 4;

const getClientXValue = (event: MouseEvent | TouchEvent | Event): number | undefined => {
  if ('clientX' in event && typeof event.clientX === 'number') return event.clientX;
  if ('touches' in event && event.touches?.length) return event.touches[0].clientX;
  return undefined;
};

const ratiosToPixels = (ratios: number[], containerWidth: number) =>
  ratios.map(percentage => Math.max(percentage * containerWidth, MIN_WIDTH));

const pixelsFromRatios = (ratios: number[], containerWidth: number): number[] => {
  const separatorCount = ratios.length - 1;
  const fromRatios = ratiosToPixels(ratios, containerWidth);
  const total = fromRatios.reduce((a, b) => a + b, 0);
  if (total > containerWidth) {
    const scale = (containerWidth - separatorCount * SEPARATOR_PX) / total;
    return fromRatios.map(width => width * scale);
  }
  return fromRatios;
};

const getRatiosFromLocalStorage = (localStorageKey?: string): number[] => {
  if (isClient && localStorageKey) {
    try {
      const parsed: number[] = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      captureException(new Error('getRatiosFromLocalStorage error', { cause: e }));
    }
  }
  return [];
};

const setRatiosToLocalStorage = (ratios: number[], localStorageKey?: string) => {
  if (isClient && localStorageKey) {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(ratios));
    } catch (e) {
      captureException(new Error('setRatiosToLocalStorage error', { cause: e }));
    }
  }
};

const PaneLayoutDesktop = ({
  children,
  localStorageKey,
  defaultRatios,
  className = '',
}: PaneLayoutProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingIndex = useRef<number | null>(null);
  const [widths, setWidths] = useState<number[]>([]);
  const widthsRef = useRef<number[]>([]);
  const ratiosRef = useRef<number[]>([]);
  const initialWidths = useRef(defaultRatios?.map(ratio => `${ratio * 100}%`));

  const handleResize = useCallback(
    (event: Event) => {
      if (draggingIndex.current === null || !containerRef.current) return;

      const xValue = getClientXValue(event);
      if (xValue === undefined) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const currentWidths = [...widthsRef.current];
      const leftIndex = draggingIndex.current;
      const rightIndex = leftIndex + 1;

      if (leftIndex < 0 || rightIndex >= children.length) return;

      const leftStart =
        currentWidths.slice(0, leftIndex).reduce((a, b) => a + b, 0) + leftIndex * SEPARATOR_PX;
      const currentLeft = xValue - containerRect.left - leftStart;
      const totalPair = currentWidths[leftIndex] + currentWidths[rightIndex];
      const rightNew = totalPair - currentLeft;

      if (currentLeft >= MIN_WIDTH && rightNew >= MIN_WIDTH) {
        currentWidths[leftIndex] = currentLeft;
        currentWidths[rightIndex] = rightNew;
        setWidths(currentWidths);

        const ratios = currentWidths.map(w => w / (containerRect.width || 1));
        ratiosRef.current = ratios;
        setRatiosToLocalStorage(ratios, localStorageKey);
      }
    },
    [children.length, localStorageKey]
  );

  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (
      widthsRef.current &&
      widthsRef.current.length === children.length &&
      widthsRef.current.some(width => width > 0)
    ) {
      return;
    }

    const containerWidth = containerRef.current.getBoundingClientRect().width || 1;
    const separatorCount = children.length - 1;
    const savedRatios = getRatiosFromLocalStorage(localStorageKey);

    let ratios: number[];
    if (savedRatios.length === children.length) {
      ratios = savedRatios;
    } else if (defaultRatios?.length) {
      ratios = defaultRatios;
    } else {
      const initialWidth =
        (containerWidth - separatorCount * SEPARATOR_PX) / Math.max(1, children.length);
      const initials = children.map(() => Math.max(initialWidth, MIN_WIDTH));
      ratios = initials.map(width => width / containerWidth);
    }

    ratiosRef.current = ratios;
    setWidths(pixelsFromRatios(ratios, containerWidth));
  }, [children, localStorageKey, defaultRatios]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(entries => {
      if (draggingIndex.current !== null) return;
      const entry = entries[0];
      if (!entry || ratiosRef.current.length === 0) return;

      const containerWidth = entry.contentRect.width || 1;
      setWidths(pixelsFromRatios(ratiosRef.current, containerWidth));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    const onMouseUp = () => {
      draggingIndex.current = null;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', onMouseUp);
    };

    event.preventDefault();
    draggingIndex.current = index;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>, index: number) => {
    const onTouchEnd = () => {
      draggingIndex.current = null;
      document.removeEventListener('touchmove', handleResize);
      document.removeEventListener('touchend', onTouchEnd);
    };

    event.preventDefault();
    draggingIndex.current = index;
    document.addEventListener('touchmove', handleResize, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  };

  return (
    <div
      ref={containerRef}
      className={`flex h-full min-h-0 bg-(--color-theme-surface-page) ${className}`}
    >
      {children.map((child, index) => (
        <Fragment key={child.key ?? index}>
          <section
            style={{ width: widths.length > 0 ? widths[index] : initialWidths?.current?.[index] }}
            className="h-full min-h-0"
          >
            <div className="h-full min-h-0 min-w-0 overflow-hidden">{child}</div>
          </section>

          {index < children.length - 1 && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={event => onMouseDown(event, index)}
              onTouchStart={event => onTouchStart(event, index)}
              className="w-1 shrink-0 cursor-col-resize self-stretch bg-transparent touch-none transition-colors hover:bg-[color-mix(in_srgb,var(--color-theme-action-primary)_30%,transparent)]"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export { PaneLayoutDesktop };
