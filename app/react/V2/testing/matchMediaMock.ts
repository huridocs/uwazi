type MatchMediaHelper = {
  matchMediaMock: jest.Mock<any, any>;
  listeners: Array<(event: MediaQueryListEvent) => void>;
  restore: () => void;
};

export const setupMatchMediaMock = (): MatchMediaHelper => {
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];

  const matchMediaMock: jest.Mock = jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: (event: string, handler: (ev: MediaQueryListEvent) => void) => {
      if (event === 'change') listeners.push(handler);
    },
    removeEventListener: (event: string, handler: (ev: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const idx = listeners.indexOf(handler);
        if (idx >= 0) listeners.splice(idx, 1);
      }
    },
    dispatchEvent: jest.fn(),
  }));

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  });

  const restore = () => {
    try {
      delete (window as any).matchMedia;
    } catch (e) {
      // silent fail
    }
  };

  return { matchMediaMock, listeners, restore };
};
