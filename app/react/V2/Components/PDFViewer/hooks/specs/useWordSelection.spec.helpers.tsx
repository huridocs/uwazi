/**
 * @jest-environment jsdom
 */

import React, { useRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { useWordSelection } from '../useWordSelection.js';

const rect = ({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect =>
  ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  }) as DOMRect;

type WordHighlight = {
  preview?: TextSelection;
  committed?: TextSelection;
};

type HarnessProps = {
  enabled: boolean;
  layoutKey?: number;
  onSelect: (selection: TextSelection) => void;
  onDeselect?: () => void;
  onHighlightChange?: (highlight: WordHighlight | undefined) => void;
  onClearReady?: (clear: () => void) => void;
};

const Harness = ({
  enabled,
  layoutKey,
  onSelect,
  onDeselect,
  onHighlightChange,
  onClearReady,
}: HarnessProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { clearSelection } = useWordSelection({
    enabled,
    containerRef,
    layoutKey,
    onSelect,
    onDeselect,
    onHighlightChange,
  });
  onClearReady?.(clearSelection);

  return (
    <div ref={containerRef} data-testid="word-root">
      <div data-region-selector-id="1">
        <div className="textLayer">
          <span data-word="one">one</span> <span data-word="two">two</span>{' '}
          <span data-word="three">three</span>
        </div>
      </div>
    </div>
  );
};

const wordNode = (label: string) => {
  const span = document.querySelector(`[data-word="${label}"]`);
  const node = span?.firstChild;
  if (!(node instanceof Text)) {
    throw new Error(`missing word ${label}`);
  }
  return node;
};

let frameQueue: FrameRequestCallback[] = [];

const installPointerFrame = () => {
  frameQueue = [];
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    frameQueue.push(cb);
    return frameQueue.length;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
    frameQueue[id - 1] = () => undefined;
  });
};

const flushPointerFrame = () => {
  const queued = frameQueue.splice(0);
  queued.forEach(callback => callback(0));
};

const hover = (root: HTMLElement, clientX: number, clientY = 5) => {
  fireEvent.mouseMove(root, { clientX, clientY });
  flushPointerFrame();
};

const renderHarness = (props: Partial<HarnessProps> = {}) => {
  const onSelect = props.onSelect || jest.fn();
  const onDeselect = props.onDeselect || jest.fn();
  const onHighlightChange = props.onHighlightChange || jest.fn();
  const view = render(
    <Harness
      enabled={props.enabled ?? true}
      layoutKey={props.layoutKey}
      onSelect={onSelect}
      onDeselect={onDeselect}
      onHighlightChange={onHighlightChange}
      onClearReady={props.onClearReady}
    />
  );
  const root = view.getByTestId('word-root');
  const region = root.querySelector('[data-region-selector-id]') as HTMLElement;
  jest
    .spyOn(region, 'getBoundingClientRect')
    .mockReturnValue(rect({ left: 0, top: 0, width: 200, height: 40 }));
  Range.prototype.getClientRects = function mockRects() {
    const boxes: Record<string, ReturnType<typeof rect>> = {
      two: rect({ left: 40, top: 0, width: 40, height: 10 }),
      three: rect({ left: 80, top: 0, width: 40, height: 10 }),
    };
    const box =
      boxes[this.startContainer.textContent || ''] ||
      rect({ left: 0, top: 0, width: 40, height: 10 });
    return Object.assign([box], {
      item: (index: number) => (index === 0 ? box : null),
    }) as unknown as DOMRectList;
  };
  return { ...view, root, onSelect, onDeselect, onHighlightChange };
};

export type { WordHighlight, HarnessProps };
export { rect, Harness, wordNode, installPointerFrame, flushPointerFrame, hover, renderHarness };
