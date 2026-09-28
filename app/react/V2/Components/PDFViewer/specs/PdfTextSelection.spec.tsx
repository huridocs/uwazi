/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { PdfTextSelection } from '../PdfTextSelection.js';

const selectText = (node: Node) => {
  const selection = window.getSelection();
  if (!selection) {
    throw new Error('missing selection');
  }
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
  return jest.spyOn(selection, 'removeAllRanges');
};

const emptyClientRects = (): DOMRectList => {
  const rects: DOMRect[] = [];
  return {
    length: 0,
    item: () => null,
    [Symbol.iterator]: () => rects[Symbol.iterator](),
  };
};

const renderSelection = (disabled = false) => {
  const onSelect = jest.fn();
  const onDeselect = jest.fn();
  const view = render(
    <PdfTextSelection onSelect={onSelect} onDeselect={onDeselect} disabled={disabled}>
      <div data-region-selector-id="1">Hello</div>
    </PdfTextSelection>
  );
  const text = view.getByText('Hello');
  const textNode = text.firstChild;
  if (!textNode) {
    throw new Error('missing text');
  }
  return { onSelect, onDeselect, text, textNode };
};

const pressTouchSelection = () => {
  const onSelect = jest.fn();
  const view = render(
    <PdfTextSelection onSelect={onSelect}>
      <div data-region-selector-id="1">Hello</div>
    </PdfTextSelection>
  );
  const text = view.getByText('Hello');
  const textNode = text.firstChild;
  if (!textNode) {
    throw new Error('missing text');
  }
  const removeAllRanges = selectText(textNode);
  fireEvent.touchStart(text);
  fireEvent.mouseDown(text);
  return { onSelect, removeAllRanges };
};

describe('PdfTextSelection', () => {
  beforeAll(() => {
    Range.prototype.getClientRects = emptyClientRects;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    window.getSelection()?.removeAllRanges();
  });

  it('does not report a selection when disabled', () => {
    const { onSelect, onDeselect, text, textNode } = renderSelection(true);
    selectText(textNode);
    fireEvent.mouseUp(text);

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDeselect).not.toHaveBeenCalled();
  });

  it('does not remount children when disabled changes', () => {
    let mounts = 0;
    const Child = () => {
      React.useEffect(() => {
        mounts += 1;
      }, []);
      return <div>Hello</div>;
    };
    const onSelect = jest.fn();
    const { rerender } = render(
      <PdfTextSelection onSelect={onSelect}>
        <Child />
      </PdfTextSelection>
    );

    expect(mounts).toBe(1);

    rerender(
      <PdfTextSelection onSelect={onSelect} disabled>
        <Child />
      </PdfTextSelection>
    );

    expect(mounts).toBe(1);
  });

  it('reports one touch selection after the selection settles', () => {
    jest.useFakeTimers();
    const { onSelect, removeAllRanges } = pressTouchSelection();
    expect(removeAllRanges).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('selectionchange'));
    document.dispatchEvent(new Event('selectionchange'));
    expect(onSelect).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello' }));
  });
});
