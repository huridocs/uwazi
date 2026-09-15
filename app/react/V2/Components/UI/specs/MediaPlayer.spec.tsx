/** @jest-environment jsdom */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MediaPlayer } from '../MediaPlayer.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-player', () => ({
  __esModule: true,
  default: ({
    url,
    config,
    light,
    playIcon,
  }: {
    url: string;
    config?: { file?: { attributes?: { style?: { objectFit?: string } } } };
    light?: React.ReactNode;
    playIcon?: React.ReactNode;
  }) => (
    <div
      data-testid="react-player"
      data-url={url}
      data-object-fit={config?.file?.attributes?.style?.objectFit}
    >
      {light}
      {playIcon}
    </div>
  ),
  canPlay: () => true,
}));

type ObservedResize = { callback: ResizeObserverCallback; node?: Element };

const resizeObservers: ObservedResize[] = [];

const ResizeObserverMock = function ResizeObserverMock(callback: ResizeObserverCallback) {
  const entry: ObservedResize = { callback };
  resizeObservers.push(entry);
  return {
    observe: (node: Element) => {
      entry.node = node;
    },
    unobserve: () => {
      entry.node = undefined;
    },
    disconnect: () => {
      const index = resizeObservers.indexOf(entry);
      if (index >= 0) {
        resizeObservers.splice(index, 1);
      }
    },
  };
};

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

  it('applies object-fit on the file video element, not only the wrapper', () => {
    render(<MediaPlayer url="/file.mp4" height="100%" style={{ objectFit: 'cover' }} />);
    const container = screen.getByTestId('media-player-container');
    act(() => {
      setClientHeight(container, 180);
      resizeObservers[0]?.callback(
        [{ contentRect: { height: 180 } } as ResizeObserverEntry],
        resizeObservers[0] as unknown as ResizeObserver
      );
    });
    expect(screen.getByTestId('react-player')).toHaveAttribute('data-object-fit', 'cover');
  });

  it('uses theme surface colors for a generic thumbnail', () => {
    render(<MediaPlayer url="/file.mp4" height="100%" thumbnail={{ fileName: 'Short video' }} />);
    const container = screen.getByTestId('media-player-container');
    act(() => {
      setClientHeight(container, 180);
      resizeObservers[0]?.callback(
        [{ contentRect: { height: 180 } } as ResizeObserverEntry],
        resizeObservers[0] as unknown as ResizeObserver
      );
    });
    const overlay = screen.getByText('Short video').parentElement;
    expect(overlay?.className).toContain('bg-warm');
    expect(overlay?.getAttribute('style') ?? '').not.toContain('156,163,175');
  });
});
