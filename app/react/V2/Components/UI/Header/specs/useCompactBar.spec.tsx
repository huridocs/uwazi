/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useCompactBar } from '../useCompactBar.js';

jest.mock('#app/V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => false,
  MOBILE_VIEW_MAX_WIDTH: 768,
}));

const widthOf = (value: number) => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => value,
  });
};

const Probe = () => {
  const { barRef, compact } = useCompactBar();
  return (
    <div ref={barRef} data-testid="bar">
      {compact ? 'compact' : 'wide'}
    </div>
  );
};

describe('useCompactBar', () => {
  const originalObserver = window.ResizeObserver;

  beforeEach(() => {
    window.ResizeObserver = class {
      private readonly onResize: ResizeObserverCallback;

      private seen: Element | undefined;

      constructor(onResize: ResizeObserverCallback) {
        this.onResize = onResize;
      }

      observe() {
        this.onResize([], this);
      }

      unobserve(target: Element) {
        this.seen = target;
      }

      disconnect() {
        this.seen = undefined;
      }
    };
  });

  afterEach(() => {
    window.ResizeObserver = originalObserver;
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  });

  it('collapses a narrow bar when the window is wide', () => {
    widthOf(360);
    render(<Probe />);
    expect(screen.getByTestId('bar')).toHaveTextContent('compact');
  });

  it('keeps a wide bar expanded', () => {
    widthOf(1200);
    render(<Probe />);
    expect(screen.getByTestId('bar')).toHaveTextContent('wide');
  });
});
