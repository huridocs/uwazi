import React from 'react';
import { captureException } from '@sentry/react';
import { isClient } from '#app/utils/index.js';
import { SEPARATOR_PX, minWidthForPane } from './paneLayoutWidths.js';

type WidthSetter = React.Dispatch<React.SetStateAction<number[]>>;

type DragInput = {
  event: Event;
  container: HTMLElement;
  widths: number[];
  leftIndex: number;
  paneCount: number;
  minPaneRatios?: number[];
};

type RatioInput = {
  paneCount: number;
  containerWidth: number;
  localStorageKey?: string;
  defaultRatios?: number[];
  minPaneRatios?: number[];
};

const getClientXValue = (event: MouseEvent | TouchEvent | Event): number | undefined => {
  if ('clientX' in event && typeof event.clientX === 'number') return event.clientX;
  if ('touches' in event && event.touches?.length) return event.touches[0].clientX;
  return undefined;
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

const withPair = (widths: number[], leftIndex: number, pair: { left: number; right: number }) => {
  const next = [...widths];
  next[leftIndex] = pair.left;
  next[leftIndex + 1] = pair.right;
  return next;
};

const dragWidths = ({
  event,
  container,
  widths,
  leftIndex,
  paneCount,
  minPaneRatios,
}: DragInput) => {
  const xValue = getClientXValue(event);
  if (xValue === undefined || leftIndex < 0 || leftIndex + 1 >= paneCount) return undefined;
  const rect = container.getBoundingClientRect();
  const leftStart =
    widths.slice(0, leftIndex).reduce((sum, width) => sum + width, 0) + leftIndex * SEPARATOR_PX;
  const currentLeft = xValue - rect.left - leftStart;
  const rightNew = widths[leftIndex] + widths[leftIndex + 1] - currentLeft;
  const tooNarrow =
    currentLeft < minWidthForPane(leftIndex, rect.width, minPaneRatios) ||
    rightNew < minWidthForPane(leftIndex + 1, rect.width, minPaneRatios);
  if (tooNarrow) return undefined;
  return withPair(widths, leftIndex, { left: currentLeft, right: rightNew });
};

const commitWidths = ({
  next,
  container,
  ratiosRef,
  setWidths,
  localStorageKey,
}: {
  next: number[];
  container: HTMLElement;
  ratiosRef: React.RefObject<number[]>;
  setWidths: WidthSetter;
  localStorageKey?: string;
}) => {
  const ratios = next.map(width => width / (container.getBoundingClientRect().width || 1));
  ratiosRef.current = ratios;
  setWidths(next);
  setRatiosToLocalStorage(ratios, localStorageKey);
};

const initialPaneRatios = ({
  paneCount,
  containerWidth,
  localStorageKey,
  defaultRatios,
  minPaneRatios,
}: RatioInput) => {
  const savedRatios = getRatiosFromLocalStorage(localStorageKey);
  if (savedRatios.length === paneCount) return savedRatios;
  if (defaultRatios?.length) return defaultRatios;
  const initialWidth = (containerWidth - (paneCount - 1) * SEPARATOR_PX) / Math.max(1, paneCount);
  return Array.from({ length: paneCount }, (_, index) => {
    const width = Math.max(initialWidth, minWidthForPane(index, containerWidth, minPaneRatios));
    return width / containerWidth;
  });
};

export type { WidthSetter };
export { commitWidths, dragWidths, initialPaneRatios };
