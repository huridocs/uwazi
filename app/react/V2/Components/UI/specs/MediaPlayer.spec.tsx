/** @jest-environment jsdom */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MediaPlayer } from '../MediaPlayer.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-player', () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => <div data-testid="react-player" data-url={url} />,
  canPlay: () => true,
}));

const resizeObservers: Array<{ callback: ResizeObserverCallback; node?: Element }> = [];

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push({ callback });
  }

  observe = (node: Element) => {
    const entry = resizeObservers.find(observer => observer.callback === this.callback);
    if (entry) {
      entry.node = node;
    }
  };

  unobserve = () => undefined;

  disconnect = () => undefined;
}

const setClientHeight = (node: HTMLElement, height: number) => {
  Object.defineProperty(node, 'clientHeight', { configurable: true, value: height });
};

describe('MediaPlayer', () => {
  beforeEach(() => {
    resizeObservers.length = 0;
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it('mounts the player after the container has a height', () => {
    render(<MediaPlayer url="/file.wav" height="100%" />);

    expect(screen.queryByTestId('react-player')).not.toBeInTheDocument();

    const container = screen.getByTestId('media-player-container');
    act(() => {
      setClientHeight(container, 180);
      resizeObservers[0]?.callback(
        [{ contentRect: { height: 180 } } as ResizeObserverEntry],
        resizeObservers[0] as unknown as ResizeObserver
      );
    });

    expect(screen.getByTestId('react-player')).toHaveAttribute('data-url', '/file.wav');
  });
});
