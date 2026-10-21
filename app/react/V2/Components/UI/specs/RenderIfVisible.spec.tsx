/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RenderIfVisible } from '../RenderIfVisible.js';

let intersecting: boolean;

const idleDeadline: IdleDeadline = { didTimeout: false, timeRemaining: () => 0 };

const runIdle: typeof window.requestIdleCallback = callback => {
  callback(idleDeadline);
  return 0;
};

const installObserver = () => {
  global.IntersectionObserver = jest
    .fn()
    .mockImplementation((callback: IntersectionObserverCallback) => ({
      observe: (target: HTMLElement) => {
        const placeholder = target.querySelector('.renderIfVisible-placeholder');
        const measured =
          placeholder instanceof HTMLElement ? Number.parseInt(placeholder.style.height, 10) : 0;
        Object.defineProperty(target, 'offsetHeight', { configurable: true, value: measured });
        callback(
          [{ isIntersecting: intersecting, target }] as unknown as IntersectionObserverEntry[],
          {} as IntersectionObserver
        );
      },
      unobserve: () => undefined,
      disconnect: () => undefined,
      takeRecords: () => [],
      root: null,
      rootMargin: '',
      thresholds: [],
    }));
};

describe('RenderIfVisible', () => {
  const originalObserver = global.IntersectionObserver;
  const originalIdle = window.requestIdleCallback;

  afterEach(() => {
    global.IntersectionObserver = originalObserver;
    window.requestIdleCallback = originalIdle;
  });

  it('renders children when IntersectionObserver is missing', () => {
    Reflect.deleteProperty(global, 'IntersectionObserver');
    render(
      <RenderIfVisible>
        <span>Visible child</span>
      </RenderIfVisible>
    );
    expect(screen.getByText('Visible child')).toBeInTheDocument();
  });

  it('renders a placeholder of defaultHeight when the node is outside the viewport', () => {
    installObserver();
    intersecting = false;
    window.requestIdleCallback = runIdle;
    render(
      <RenderIfVisible defaultHeight={120}>
        <span>Offscreen child</span>
      </RenderIfVisible>
    );
    expect(screen.queryByText('Offscreen child')).not.toBeInTheDocument();
    const placeholder = document.querySelector('.renderIfVisible-placeholder');
    expect(placeholder).toHaveStyle({ height: '120px' });
  });

  it('renders children once the node intersects', () => {
    installObserver();
    intersecting = true;
    window.requestIdleCallback = runIdle;
    render(
      <RenderIfVisible defaultHeight={120}>
        <span>Onscreen child</span>
      </RenderIfVisible>
    );
    expect(screen.getByText('Onscreen child')).toBeInTheDocument();
  });

  it('keeps the first paint of an initially visible node', () => {
    installObserver();
    intersecting = true;
    window.requestIdleCallback = runIdle;
    render(
      <RenderIfVisible initialVisible defaultHeight={80}>
        <span>Eager child</span>
      </RenderIfVisible>
    );
    expect(screen.getByText('Eager child')).toBeInTheDocument();
  });
});
