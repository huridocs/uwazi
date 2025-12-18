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
  const ratiosRef = useRef<number[]>([]);

  const [rations, setRations] = useState<number[]>(() => {
    const savedPercentages = getPercentagesFromLocalStorage(localStorageKey);

    if (savedPercentages.length === children.length) {
      return savedPercentages;
    }

    if (defaultWidthsPercents?.length === children.length) {
      return defaultWidthsPercents;
    }

    const ratio = 1 / children.length;
    return Array(children.length).fill(ratio);
  });

  const handleResize = useCallback(
    // eslint-disable-next-line max-statements
    (event: Event) => {
      if (draggingIndex.current === null || !containerRef.current) return;

      const xValue = getClientXValue(event);

      if (xValue === undefined) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width || 1;
      const currentRatios = [...ratiosRef.current];
      const leftIndex = draggingIndex.current;
      const rightIndex = leftIndex + 1;

      if (leftIndex < 0 || rightIndex >= children.length) return;

      // Account for separator widths
      const separatorCount = children.length - 1;
      const availableWidth = containerWidth - separatorCount * SEPARATOR_PX;
      const currentWidths = currentRatios.map(ratio => ratio * availableWidth);
      const leftStart =
        currentWidths.slice(0, leftIndex).reduce((a, b) => a + b, 0) + leftIndex * SEPARATOR_PX;
      const currentLeft = xValue - containerRect.left - leftStart;
      const totalPair = currentWidths[leftIndex] + currentWidths[rightIndex];
      const rightNew = totalPair - currentLeft;

      if (currentLeft >= MIN_WIDTH && rightNew >= MIN_WIDTH) {
        // Convert back to ratios relative to available width
        currentRatios[leftIndex] = currentLeft / availableWidth;
        currentRatios[rightIndex] = rightNew / availableWidth;
        setRations(currentRatios);
        setPercentagesToLocalStorage(currentRatios, localStorageKey);
      }
    },
    [children.length, localStorageKey]
  );

  useEffect(() => {
    ratiosRef.current = rations;
  }, [rations]);

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!containerRef.current || !isClient) return;

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
    if (!containerRef.current || !isClient) return;

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
          <section
            style={{
              flex: rations[index] || 1,
            }}
            className="h-full min-h-0"
          >
            <div className="h-full min-h-0 overflow-auto">{child}</div>
          </section>

          {index < children.length - 1 && (
            <div
              aria-hidden
              role="separator"
              onMouseDown={event => onMouseDown(event, index)}
              onTouchStart={event => onTouchStart(event, index)}
              className="cursor-col-resize shrink-0 group"
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
