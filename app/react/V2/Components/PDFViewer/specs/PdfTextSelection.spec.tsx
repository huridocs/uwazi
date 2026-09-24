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
    jest.restoreAllMocks();
    window.getSelection()?.removeAllRanges();
  });

  it('reports a touch selection and does not clear it on the touch press', () => {
    const { onSelect, removeAllRanges } = pressTouchSelection();
    expect(removeAllRanges).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('selectionchange'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello' }));
  });
});
