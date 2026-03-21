/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { scrollIntoView } from '../scrollIntoView.js';

type Block = 'start' | 'center' | 'end';

type Geometry = {
  targetTop: number;
  targetHeight: number;
  containerTop: number;
  containerHeight: number;
};

const makeRect = (top: number, height: number): DOMRect =>
  ({
    x: 0,
    y: top,
    width: 100,
    height,
    top,
    right: 100,
    bottom: top + height,
    left: 0,
    toJSON: () => ({}),
  }) as DOMRect;

const expectedTopForBlock = (block: Block, geometry: Geometry, initialScrollTop = 0): number => {
  const elementTopInParent = geometry.targetTop - geometry.containerTop + initialScrollTop;

  if (block === 'center') {
    return Math.max(0, elementTopInParent - (geometry.containerHeight - geometry.targetHeight) / 2);
  }

  if (block === 'end') {
    return Math.max(0, elementTopInParent - geometry.containerHeight + geometry.targetHeight);
  }

  return Math.max(0, elementTopInParent);
};

const setupScrollContainer = (element: HTMLElement, clientHeight: number) => {
  const node = element;

  Object.defineProperty(node, 'scrollTop', {
    value: 0,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(node, 'clientHeight', {
    value: clientHeight,
    configurable: true,
  });

  const scrollToMock = jest.fn((options?: ScrollToOptions | number, y?: number) => {
    if (typeof options === 'number') {
      node.scrollTop = y ?? node.scrollTop;
      return;
    }

    node.scrollTop = options?.top ?? node.scrollTop;
  });

  Object.defineProperty(node, 'scrollTo', {
    value: scrollToMock,
    writable: true,
    configurable: true,
  });

  return scrollToMock;
};

const Fixture = ({ mode = 'immediate' }: { mode?: 'immediate' | 'grandparent' }) => {
  if (mode === 'grandparent') {
    return (
      <div data-testid="grandparent" style={{ overflowY: 'auto', height: 200 }}>
        <div style={{ height: 100 }} />
        <div data-testid="middle">
          <div data-testid="target" style={{ height: 50 }} />
        </div>
        <div style={{ height: 300 }} />
      </div>
    );
  }

  return (
    <div data-testid="grandparent" style={{ overflowY: 'auto', height: 300 }}>
      <div style={{ height: 120 }} />
      <div data-testid="parent" style={{ overflowY: 'auto', height: 200 }}>
        <div style={{ height: 80 }} />
        <div data-testid="target" style={{ height: 50 }} />
        <div style={{ height: 400 }} />
      </div>
      <div style={{ height: 300 }} />
    </div>
  );
};

describe('scrollIntoView', () => {
  it.each(['start', 'center', 'end'] as const)(
    'scrolls only the immediate scrollable parent for block=%s',
    block => {
      const { getByTestId } = render(<Fixture mode="immediate" />);
      const grandparent = getByTestId('grandparent');
      const parent = getByTestId('parent');
      const target = getByTestId('target');

      const grandparentScrollToMock = setupScrollContainer(grandparent, 300);
      const parentScrollToMock = setupScrollContainer(parent, 200);

      const geometry: Geometry = {
        targetTop: 420,
        targetHeight: 50,
        containerTop: 120,
        containerHeight: 200,
      };

      target.getBoundingClientRect = jest
        .fn()
        .mockReturnValue(makeRect(geometry.targetTop, geometry.targetHeight));
      parent.getBoundingClientRect = jest
        .fn()
        .mockReturnValue(makeRect(geometry.containerTop, geometry.containerHeight));

      scrollIntoView(target, { block });

      expect(parent.scrollTop).toBe(expectedTopForBlock(block, geometry));
      expect(grandparent.scrollTop).toBe(0);
      expect(parentScrollToMock).toHaveBeenCalledTimes(1);
      expect(grandparentScrollToMock).not.toHaveBeenCalled();
    }
  );

  it('scrolls the first available scrollable ancestor', () => {
    const { getByTestId } = render(<Fixture mode="grandparent" />);
    const grandparent = getByTestId('grandparent');
    const middle = getByTestId('middle');
    const target = getByTestId('target');

    const grandparentScrollToMock = setupScrollContainer(grandparent, 300);
    const parentScrollToMock = setupScrollContainer(middle, 200);

    const geometry: Geometry = {
      targetTop: 350,
      targetHeight: 50,
      containerTop: 100,
      containerHeight: 200,
    };

    target.getBoundingClientRect = jest
      .fn()
      .mockReturnValue(makeRect(geometry.targetTop, geometry.targetHeight));
    grandparent.getBoundingClientRect = jest
      .fn()
      .mockReturnValue(makeRect(geometry.containerTop, geometry.containerHeight));

    scrollIntoView(target, { block: 'start' });

    expect(parentScrollToMock).not.toHaveBeenCalled();
    expect(grandparent.scrollTop).toBe(expectedTopForBlock('start', geometry));
    expect(grandparentScrollToMock).toHaveBeenCalledTimes(1);
  });
});
