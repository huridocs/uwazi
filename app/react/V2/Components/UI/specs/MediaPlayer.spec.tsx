/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
    onError,
  }: {
    url: string;
    config?: { file?: { attributes?: { style?: { objectFit?: string } } } };
    light?: React.ReactNode;
    playIcon?: React.ReactNode;
    onError?: () => void;
  }) => (
    <div
      data-testid="react-player"
      data-url={url}
      data-object-fit={config?.file?.attributes?.style?.objectFit}
    >
      {light}
      {playIcon}
      <button type="button" onClick={() => onError?.()}>
        fail
      </button>
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

const notifyResize = (container: HTMLElement, height: number) => {
  setClientHeight(container, height);
  resizeObservers[0]?.callback(
    [{ contentRect: { height } } as ResizeObserverEntry],
    resizeObservers[0] as unknown as ResizeObserver
  );
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
    act(() => notifyResize(container, 180));

    expect(screen.getByTestId('react-player')).toHaveAttribute('data-url', '/file.wav');
  });

  it('applies object-fit on the file video element, not only the wrapper', () => {
    render(<MediaPlayer url="/file.mp4" height="100%" style={{ objectFit: 'cover' }} />);
    const container = screen.getByTestId('media-player-container');
    act(() => notifyResize(container, 180));
    expect(screen.getByTestId('react-player')).toHaveAttribute('data-object-fit', 'cover');
  });

  it('uses theme surface colors for a generic thumbnail', () => {
    render(<MediaPlayer url="/file.mp4" height="100%" thumbnail={{ fileName: 'Short video' }} />);
    const container = screen.getByTestId('media-player-container');
    act(() => notifyResize(container, 180));
    const overlay = screen.getByText('Short video').parentElement;
    expect(overlay?.className).toContain('bg-warm');
    expect(overlay?.getAttribute('style') ?? '').not.toContain('156,163,175');
  });

  it('retries the new url after a previous media file failed to load', () => {
    const { rerender } = render(<MediaPlayer url="/en.mp4" height="100%" />);
    act(() => notifyResize(screen.getByTestId('media-player-container'), 180));
    fireEvent.click(screen.getByRole('button', { name: 'fail' }));
    expect(screen.getByText('Error loading your media')).toBeInTheDocument();
    expect(screen.queryByTestId('react-player')).not.toBeInTheDocument();

    rerender(<MediaPlayer url="/es.mp4" height="100%" />);
    act(() => notifyResize(screen.getByTestId('media-player-container'), 180));
    expect(screen.queryByText('Error loading your media')).not.toBeInTheDocument();
    expect(screen.getByTestId('react-player')).toHaveAttribute('data-url', '/es.mp4');
  });
});
