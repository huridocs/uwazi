import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PaneLayoutProps, PaneProps } from './types.js';
import { paneWidthsFromRatios } from './paneLayoutWidths.js';
import {
  commitWidths,
  dragWidths,
  initialPaneRatios,
  type WidthSetter,
} from './paneDesktopMath.js';

type LayoutRefs = {
  panes: React.ReactElement<PaneProps>[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  draggingIndex: React.RefObject<number | null>;
  widths: number[];
  setWidths: WidthSetter;
  widthsRef: React.RefObject<number[]>;
  ratiosRef: React.RefObject<number[]>;
  minPaneRatiosRef: React.RefObject<number[] | undefined>;
  localStorageKey?: string;
  defaultRatios?: number[];
  minPaneRatios?: number[];
};

const usePaneState = (minPaneRatios?: number[]) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingIndex = useRef<number | null>(null);
  const [widths, setWidths] = useState<number[]>([]);
  const widthsRef = useRef<number[]>([]);
  const ratiosRef = useRef<number[]>([]);
  const minPaneRatiosRef = useRef(minPaneRatios);
  return {
    containerRef,
    draggingIndex,
    widths,
    setWidths,
    widthsRef,
    ratiosRef,
    minPaneRatiosRef,
  };
};

const useApplyPaneWidths = ({
  panes,
  containerRef,
  widths,
  widthsRef,
  ratiosRef,
  setWidths,
  localStorageKey,
  defaultRatios,
  minPaneRatios,
  minPaneRatiosRef,
}: LayoutRefs) => {
  useEffect(() => {
    minPaneRatiosRef.current = minPaneRatios;
  }, [minPaneRatios, minPaneRatiosRef]);

  useEffect(() => {
    widthsRef.current = widths;
  }, [widths, widthsRef]);

  useEffect(() => {
    const container = containerRef.current;
    const ready =
      widthsRef.current.length === panes.length && widthsRef.current.some(width => width > 0);
    if (!container || ready) return;
    const containerWidth = container.getBoundingClientRect().width || 1;
    const ratios = initialPaneRatios({
      paneCount: panes.length,
      containerWidth,
      localStorageKey,
      defaultRatios,
      minPaneRatios,
    });
    ratiosRef.current = ratios;
    setWidths(paneWidthsFromRatios(ratios, containerWidth, minPaneRatios));
  }, [
    containerRef,
    defaultRatios,
    localStorageKey,
    minPaneRatios,
    panes,
    ratiosRef,
    setWidths,
    widthsRef,
  ]);
};

const useObservePaneWidth = ({
  containerRef,
  draggingIndex,
  ratiosRef,
  minPaneRatiosRef,
  setWidths,
}: LayoutRefs) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(entries => {
      const [entry] = entries;
      if (draggingIndex.current !== null || !entry || ratiosRef.current.length === 0) return;
      const containerWidth = entry.contentRect.width || 1;
      setWidths(paneWidthsFromRatios(ratiosRef.current, containerWidth, minPaneRatiosRef.current));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, draggingIndex, minPaneRatiosRef, ratiosRef, setWidths]);
};

const usePaneResize = ({
  draggingIndex,
  containerRef,
  widthsRef,
  ratiosRef,
  setWidths,
  panes,
  minPaneRatios,
  localStorageKey,
}: LayoutRefs) =>
  useCallback(
    (event: Event) => {
      const container = containerRef.current;
      const leftIndex = draggingIndex.current;
      if (leftIndex === null || !container) return;
      const next = dragWidths({
        event,
        container,
        widths: widthsRef.current,
        leftIndex,
        paneCount: panes.length,
        minPaneRatios,
      });
      if (!next) return;
      commitWidths({ next, container, ratiosRef, setWidths, localStorageKey });
    },
    [
      containerRef,
      draggingIndex,
      localStorageKey,
      minPaneRatios,
      panes.length,
      ratiosRef,
      setWidths,
      widthsRef,
    ]
  );

const startDrag = ({
  moveEvent,
  endEvent,
  handleResize,
  draggingIndex,
  index,
}: {
  moveEvent: 'mousemove' | 'touchmove';
  endEvent: 'mouseup' | 'touchend';
  handleResize: (event: Event) => void;
  draggingIndex: React.RefObject<number | null>;
  index: number;
}) => {
  const onEnd = () => {
    draggingIndex.current = null;
    document.removeEventListener(moveEvent, handleResize);
    document.removeEventListener(endEvent, onEnd);
  };
  draggingIndex.current = index;
  document.addEventListener(
    moveEvent,
    handleResize,
    moveEvent === 'touchmove' ? { passive: false } : false
  );
  document.addEventListener(endEvent, onEnd);
};

const usePanePointer = (
  draggingIndex: React.RefObject<number | null>,
  handleResize: (event: Event) => void
) => {
  const onMouseDown = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    startDrag({ moveEvent: 'mousemove', endEvent: 'mouseup', handleResize, draggingIndex, index });
  };
  const onTouchStart = (event: React.TouchEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    startDrag({
      moveEvent: 'touchmove',
      endEvent: 'touchend',
      handleResize,
      draggingIndex,
      index,
    });
  };
  return { onMouseDown, onTouchStart };
};

const useDesktopPaneLayout = (
  panes: React.ReactElement<PaneProps>[],
  layoutProps: Pick<PaneLayoutProps, 'localStorageKey' | 'defaultRatios' | 'minPaneRatios'>
) => {
  const state = usePaneState(layoutProps.minPaneRatios);
  const input = {
    panes,
    ...state,
    localStorageKey: layoutProps.localStorageKey,
    defaultRatios: layoutProps.defaultRatios,
    minPaneRatios: layoutProps.minPaneRatios,
  };
  useApplyPaneWidths(input);
  useObservePaneWidth(input);
  const handleResize = usePaneResize(input);
  const pointer = usePanePointer(state.draggingIndex, handleResize);
  return {
    containerRef: state.containerRef,
    widths: state.widths,
    onMouseDown: pointer.onMouseDown,
    onTouchStart: pointer.onTouchStart,
  };
};

export { useDesktopPaneLayout };
