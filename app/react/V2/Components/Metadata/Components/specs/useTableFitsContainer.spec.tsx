/**
 * @jest-environment jsdom
 */
import React, { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { shouldShowCards, useTableFitsContainer } from '../useTableFitsContainer.js';

const observers: ResizeObserverMock[] = [];

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    observers.push(this);
  }

  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

const widths = { container: 716, table: 400 };

const widthFor = (el: HTMLElement, key: 'root' | 'probe') =>
  el.getAttribute(`data-connections-${key}`) ? widths[key === 'root' ? 'container' : 'table'] : 0;

const TestFit = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLTableElement>(null);
  const showCards = useTableFitsContainer(containerRef, probeRef);
  return (
    <div data-connections-root ref={containerRef}>
      <table data-connections-probe ref={probeRef} />
      <span data-testid="mode">{showCards ? 'cards' : 'table'}</span>
    </div>
  );
};

describe('shouldShowCards', () => {
  it('shows cards when the table is wider than the container', () => {
    expect(shouldShowCards(716, 800, false)).toBe(true);
    expect(shouldShowCards(716, 500, false)).toBe(false);
  });

  it('keeps cards until the table fits with 8px hysteresis', () => {
    expect(shouldShowCards(716, 709, true)).toBe(true);
    expect(shouldShowCards(716, 708, true)).toBe(false);
  });
});

describe('useTableFitsContainer', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: ResizeObserverMock,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return widthFor(this, 'root');
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return widthFor(this, 'probe');
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return 0;
      },
    });
  });

  beforeEach(() => {
    observers.length = 0;
    widths.container = 716;
    widths.table = 400;
  });

  it('shows the table when Image+Media+Text columns fit a 716px card', () => {
    widths.table = 700;
    render(<TestFit />);
    expect(screen.getByTestId('mode').textContent).toBe('table');
  });

  it('shows cards when max-content is wider than the card', () => {
    widths.table = 800;
    render(<TestFit />);
    expect(screen.getByTestId('mode').textContent).toBe('cards');
  });

  const fireObserver = () => {
    const [observer] = observers;
    if (!observer) {
      throw new Error('missing ResizeObserver');
    }
    jest.useFakeTimers();
    act(() => {
      observer.callback([], observer);
      jest.advanceTimersByTime(160);
    });
    jest.useRealTimers();
  };

  it('switches back to the table after resize with hysteresis', () => {
    widths.table = 800;
    render(<TestFit />);
    expect(screen.getByTestId('mode').textContent).toBe('cards');
    widths.container = 804;
    fireObserver();
    expect(screen.getByTestId('mode').textContent).toBe('cards');
    widths.container = 820;
    fireObserver();
    expect(screen.getByTestId('mode').textContent).toBe('table');
  });
});
