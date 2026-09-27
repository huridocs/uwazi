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

type HarnessProps = {
  enabled: boolean;
  onSelect: (selection: TextSelection) => void;
  onDeselect?: () => void;
  onPreviewChange?: (selection: TextSelection | undefined) => void;
};

const Harness = ({ enabled, onSelect, onDeselect, onPreviewChange }: HarnessProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useWordSelection({
    enabled,
    containerRef,
    onSelect,
    onDeselect,
    onPreviewChange,
  });

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

describe('useWordSelection', () => {
  const originalCaret = document.caretPositionFromPoint;
  const originalGetClientRects = Range.prototype.getClientRects;

  beforeEach(() => {
    Object.defineProperty(document, 'caretPositionFromPoint', {
      configurable: true,
      value: (x: number) => {
        if (x < 40) return { offsetNode: wordNode('one'), offset: 0 };
        if (x < 80) return { offsetNode: wordNode('two'), offset: 0 };
        if (x < 120) return { offsetNode: wordNode('three'), offset: 0 };
        return null;
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(document, 'caretPositionFromPoint', {
      configurable: true,
      value: originalCaret,
    });
    Range.prototype.getClientRects = originalGetClientRects;
  });

  const renderHarness = (props: Partial<HarnessProps> = {}) => {
    const onSelect = props.onSelect || jest.fn();
    const onDeselect = props.onDeselect || jest.fn();
    const onPreviewChange = props.onPreviewChange || jest.fn();
    const view = render(
      <Harness
        enabled={props.enabled ?? true}
        onSelect={onSelect}
        onDeselect={onDeselect}
        onPreviewChange={onPreviewChange}
      />
    );
    const root = view.getByTestId('word-root');
    const region = root.querySelector('[data-region-selector-id]') as HTMLElement;
    jest
      .spyOn(region, 'getBoundingClientRect')
      .mockReturnValue(rect({ left: 0, top: 0, width: 200, height: 40 }));
    Range.prototype.getClientRects = () =>
      Object.assign([rect({ left: 0, top: 0, width: 20, height: 10 })], {
        item: (index: number) =>
          index === 0 ? rect({ left: 0, top: 0, width: 20, height: 10 }) : null,
      }) as unknown as DOMRectList;
    return { ...view, root, onSelect, onDeselect, onPreviewChange };
  };

  it('previews from the anchor word to the hovered word and commits on the second click', () => {
    const { root, onSelect, onPreviewChange } = renderHarness();

    fireEvent.click(root, { clientX: 10, clientY: 5 });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onPreviewChange).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'one' }));

    fireEvent.mouseMove(root, { clientX: 100, clientY: 5 });
    expect(onPreviewChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ text: 'one two three' })
    );

    fireEvent.click(root, { clientX: 100, clientY: 5 });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: 'one two three' }));
    expect(onPreviewChange).toHaveBeenLastCalledWith(undefined);
  });

  it('cancels an in-progress selection when clicking outside any word', () => {
    const { root, onSelect, onDeselect, onPreviewChange } = renderHarness();

    fireEvent.click(root, { clientX: 10, clientY: 5 });
    fireEvent.click(root, { clientX: 400, clientY: 5 });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(onPreviewChange).toHaveBeenLastCalledWith(undefined);
  });

  it('does not capture clicks when the mode is disabled', () => {
    const { root, onSelect, onPreviewChange } = renderHarness({ enabled: false });

    fireEvent.click(root, { clientX: 10, clientY: 5 });
    fireEvent.click(root, { clientX: 100, clientY: 5 });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onPreviewChange).not.toHaveBeenCalled();
  });
});
