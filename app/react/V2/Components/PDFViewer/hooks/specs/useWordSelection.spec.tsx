/**
 * @jest-environment jsdom
 */

import { fireEvent } from '@testing-library/react';
import {
  flushPointerFrame,
  hover,
  installPointerFrame,
  renderHarness,
  wordNode,
} from './useWordSelection.helpers.js';

describe('useWordSelection', () => {
  const originalCaret = document.caretPositionFromPoint;
  const originalGetClientRects = Range.prototype.getClientRects;

  beforeEach(() => {
    installPointerFrame();
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
    jest.restoreAllMocks();
  });

  describe('highlighting', () => {
    it('illuminates the word under the pointer before any click', () => {
      const { root, onSelect, onHighlightChange } = renderHarness();

      hover(root, 100);

      expect(onSelect).not.toHaveBeenCalled();
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        preview: expect.objectContaining({ text: 'three' }),
      });
    });

    it('previews from the anchor word to the hovered word and keeps the highlight after commit', () => {
      const { root, onSelect, onHighlightChange } = renderHarness();

      fireEvent.click(root, { clientX: 10, clientY: 5 });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        preview: expect.objectContaining({ text: 'one' }),
      });

      hover(root, 100);
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        preview: expect.objectContaining({ text: 'one two three' }),
      });

      fireEvent.click(root, { clientX: 100, clientY: 5 });
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: 'one two three' }));
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        committed: expect.objectContaining({ text: 'one two three' }),
      });
    });

    it('illuminates hovered words after commit without replacing the selection', () => {
      const { root, onHighlightChange } = renderHarness();

      fireEvent.click(root, { clientX: 10, clientY: 5 });
      fireEvent.click(root, { clientX: 100, clientY: 5 });

      hover(root, 10);
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        preview: expect.objectContaining({ text: 'one' }),
        committed: expect.objectContaining({ text: 'one two three' }),
      });

      hover(root, 400);
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        committed: expect.objectContaining({ text: 'one two three' }),
      });
    });

    it('cancels an in-progress selection when clicking outside any word', () => {
      const { root, onSelect, onDeselect, onHighlightChange } = renderHarness();

      fireEvent.click(root, { clientX: 10, clientY: 5 });
      fireEvent.click(root, { clientX: 400, clientY: 5 });

      expect(onSelect).not.toHaveBeenCalled();
      expect(onDeselect).toHaveBeenCalledTimes(1);
      expect(onHighlightChange).toHaveBeenLastCalledWith(undefined);
    });
  });

  describe('when the range is committed', () => {
    it('clears a committed highlight through clearSelection', () => {
      let clearSelection = () => {};
      const onDeselect = jest.fn();
      const onHighlightChange = jest.fn();
      const { root, onSelect } = renderHarness({
        onDeselect,
        onHighlightChange,
        onClearReady: clear => {
          clearSelection = clear;
        },
      });

      fireEvent.click(root, { clientX: 10, clientY: 5 });
      fireEvent.click(root, { clientX: 100, clientY: 5 });
      expect(onSelect).toHaveBeenCalledTimes(1);

      clearSelection();

      expect(onDeselect).toHaveBeenCalled();
      expect(onHighlightChange).toHaveBeenLastCalledWith(undefined);
    });
  });

  describe('when the mode is disabled', () => {
    it('does not capture clicks', () => {
      const { root, onSelect, onHighlightChange } = renderHarness({ enabled: false });

      fireEvent.click(root, { clientX: 10, clientY: 5 });
      fireEvent.click(root, { clientX: 100, clientY: 5 });

      expect(onSelect).not.toHaveBeenCalled();
      expect(onHighlightChange).not.toHaveBeenCalled();
    });
  });

  describe('copy', () => {
    const writeText = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      writeText.mockClear();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
    });

    const commitRange = (root: HTMLElement) => {
      fireEvent.click(root, { clientX: 10, clientY: 5 });
      fireEvent.click(root, { clientX: 100, clientY: 5 });
    };

    it('copies the committed text with ctrl/cmd+c when there is no native selection', () => {
      const { root } = renderHarness();
      commitRange(root);

      fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

      expect(writeText).toHaveBeenCalledWith('one two three');
    });

    it('does not copy before the range is committed', () => {
      const { root } = renderHarness();
      fireEvent.click(root, { clientX: 10, clientY: 5 });

      fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

      expect(writeText).not.toHaveBeenCalled();
    });

    it('does not copy when an editable field is focused', () => {
      const { root } = renderHarness();
      commitRange(root);
      const input = document.createElement('input');
      document.body.appendChild(input);

      fireEvent.keyDown(input, { key: 'c', ctrlKey: true });

      expect(writeText).not.toHaveBeenCalled();
      input.remove();
    });
  });

  describe('performance', () => {
    it('does not publish again when the pointer stays on the same word', () => {
      const { root, onHighlightChange } = renderHarness();

      hover(root, 100);
      hover(root, 110);

      expect(onHighlightChange).toHaveBeenCalledTimes(1);
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        preview: expect.objectContaining({ text: 'three' }),
      });
    });

    it('coalesces pointer moves into one frame', () => {
      const { root, onHighlightChange } = renderHarness();

      fireEvent.mouseMove(root, { clientX: 10, clientY: 5 });
      fireEvent.mouseMove(root, { clientX: 50, clientY: 5 });
      fireEvent.mouseMove(root, { clientX: 100, clientY: 5 });

      expect(onHighlightChange).not.toHaveBeenCalled();

      flushPointerFrame();

      expect(onHighlightChange).toHaveBeenCalledTimes(1);
      expect(onHighlightChange).toHaveBeenLastCalledWith({
        preview: expect.objectContaining({ text: 'three' }),
      });
    });

    it('measures word boxes once until layout is invalidated', () => {
      const { root } = renderHarness();
      const getClientRects = jest.fn(Range.prototype.getClientRects);
      Range.prototype.getClientRects = getClientRects;

      hover(root, 100);
      const measured = getClientRects.mock.calls.length;
      expect(measured).toBeGreaterThan(0);

      hover(root, 10);
      hover(root, 50);

      expect(getClientRects).toHaveBeenCalledTimes(measured);
    });
  });
});
