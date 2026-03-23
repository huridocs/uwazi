/**
 * @jest-environment jsdom
 */

import React, { useRef } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useContainerWidth } from '../hooks/useContainerWidth.js';

const resizeObservers: Array<any> = [];

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    resizeObservers.push(this);
  }

  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as any;

const TestComp = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const width = useContainerWidth(ref, { borderWidth: 1, safetyBuffer: 2, debounce: 150 });

  return (
    <div>
      <div id="target" ref={ref} />
      <span data-testid="width">{width ?? 'undef'}</span>
    </div>
  );
};

describe('useContainerWidth', () => {
  afterEach(() => {
    resizeObservers.length = 0;
  });

  it('reads initial width and updates on resize', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 300,
    });

    const { getByTestId } = render(<TestComp />);

    await waitFor(() => expect(getByTestId('width').textContent).toBe(String(300 - 4)));

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 200,
    });

    const observer = resizeObservers[resizeObservers.length - 1];
    const target = document.getElementById('target');

    jest.useFakeTimers();

    act(() => {
      observer.callback([{ contentRect: { width: 200, height: 100 }, target } as any]);
      jest.advanceTimersByTime(160);
    });

    await waitFor(() => expect(getByTestId('width').textContent).toBe(String(200 - 4)));

    jest.useRealTimers();
  });
});
