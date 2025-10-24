import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { captureException } from '@sentry/react';
import { isClient } from 'app/utils';
import { PaneLayoutProps } from './types';

const MIN_WIDTH = 100;
const SEPARATOR_PX = 4;

const getClientXValue = (event: MouseEvent | TouchEvent | Event): number | undefined => {
  if ('clientX' in event && typeof event.clientX === 'number') return event.clientX;
  if ('touches' in event && event.touches?.length) return event.touches[0].clientX;
  return undefined;
};

const percentWidthToPixel = (percentWidths: number[], containerWidth: number) =>
  percentWidths.map(percentage => Math.max(percentage * containerWidth, MIN_WIDTH));

const getPercentagesFromLocalStorage = (localStorageKey?: string): number[] => {
  if (isClient && localStorageKey) {
    try {
      const parsed: number[] = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      captureException(new Error('getPercentagesFromLocalStorage error', { cause: e }));
    }
  }
  return [];
};

const setPercentagesToLocalStorage = (percentages: number[], localStorageKey?: string) => {
  if (isClient && localStorageKey) {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(percentages));
    } catch (e) {
      captureException(new Error('setPercentagesToLocalStorage error', { cause: e }));
    }
  }
};

// eslint-disable-next-line max-statements
const PaneLayoutDesktop = ({
  children,
  localStorageKey,
  defaultWidthsPercents,
  className = '',
}: PaneLayoutProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingIndex = useRef<number | null>(null);
  const [widths, setWidths] = useState<number[]>([]);
  const widthsRef = useRef<number[]>([]);

  const handleResize = useCallback(
    // eslint-disable-next-line max-statements
    (event: Event) => {
      if (draggingIndex.current === null || !containerRef.current) return;

      const xValue = getClientXValue(event);
      if (xValue === undefined) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const currentWidths = [...widthsRef.current];
      const leftIndex = draggingIndex.current;
      const rightIndex = leftIndex + 1;

      if (leftIndex < 0 || rightIndex >= children.length) return;

      const leftStart = currentWidths.slice(0, leftIndex).reduce((a, b) => a + b, 0);
      const currentLeft = xValue - containerRect.left - leftStart;
      const totalPair = currentWidths[leftIndex] + currentWidths[rightIndex];
      const rightNew = totalPair - currentLeft;

      if (currentLeft >= MIN_WIDTH && rightNew >= MIN_WIDTH) {
        currentWidths[leftIndex] = currentLeft;
        currentWidths[rightIndex] = rightNew;
        setWidths(currentWidths);

        const percentages = currentWidths.map(w => w / (containerRect.width || 1));
        setPercentagesToLocalStorage(percentages, localStorageKey);
      }
    },
    [children.length, localStorageKey]
  );

  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  // eslint-disable-next-line max-statements
  useEffect(() => {
    if (!containerRef.current) return;

    if (
      widthsRef.current &&
      widthsRef.current.length === children.length &&
      widthsRef.current.some(w => w > 0)
    ) {
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width || 1;
    const separatorCount = children.length - 1;

    const savedPercentages = getPercentagesFromLocalStorage(localStorageKey);

    if (savedPercentages.length === children.length) {
      const fromStorage = percentWidthToPixel(savedPercentages, containerWidth);
      const total = fromStorage.reduce((a, b) => a + b, 0);
      if (total > containerWidth) {
        const scale = (containerWidth - separatorCount * SEPARATOR_PX) / total;
        setWidths(fromStorage.map(width => width * scale));
      } else {
        setWidths(fromStorage);
      }
    } else if (defaultWidthsPercents?.length) {
      setWidths(percentWidthToPixel(defaultWidthsPercents, containerWidth));
    } else {
      const initialWidth =
        (containerWidth - separatorCount * SEPARATOR_PX) / Math.max(1, children.length);
      const initials = children.map(() => Math.max(initialWidth, MIN_WIDTH));
      setWidths(initials);
    }
  }, [children, localStorageKey, defaultWidthsPercents]);

  useEffect(() => {
    const handleScreenResize = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width || 1;
      const percentages = widthsRef.current.map(w => w / containerWidth);
      setWidths(percentWidthToPixel(percentages, containerWidth));
    };

    window.addEventListener('resize', handleScreenResize);
    return () => window.removeEventListener('resize', handleScreenResize);
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
    <div ref={containerRef} className={`flex h-full min-h-0 ${className}`}>
      {children.map((child, index) => (
        <Fragment key={child.key ?? index}>
          <section style={{ width: widths[index] }} className="h-full min-h-0">
            <div className="h-full min-h-0 overflow-auto">{child}</div>
          </section>

          {index < children.length - 1 && (
            <div
              aria-hidden
              role="separator"
              onMouseDown={event => onMouseDown(event, index)}
              onTouchStart={event => onTouchStart(event, index)}
              className="cursor-col-resize flex-shrink-0 group"
              style={{ width: SEPARATOR_PX }}
            >
              <div
                className="h-full border-r border-gray-300 group-hover:border-gray-400"
                style={{ width: SEPARATOR_PX / 2 }}
              />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
};

export { PaneLayoutDesktop };
