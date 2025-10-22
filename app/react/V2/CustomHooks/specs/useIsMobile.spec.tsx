/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'jotai';
import { serverIsMobileAtom } from 'V2/atoms/isMobileAtom';
import { TestAtomStoreProvider } from 'V2/testing/TestAtomStoreProvider';
import { useIsMobile, MOBILE_VIEW_MAX_WIDTH } from '../useIsMobile';

describe('useIsMobile', () => {
  let matchMediaMock: jest.Mock;
  let listeners: ((event: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    listeners = [];
    matchMediaMock = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners.push(handler);
        }
      }),
      removeEventListener: jest.fn(
        (event: string, handler: (event: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners = listeners.filter(l => l !== handler);
          }
        }
      ),
      dispatchEvent: jest.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider>{children}</Provider>;

  describe('initialization', () => {
    it('should return true when window width is less than MOBILE_VIEW_MAX_WIDTH', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return false when window width is greater than or equal to MOBILE_VIEW_MAX_WIDTH', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(false);
    });

    it('should use the default MOBILE_VIEW_MAX_WIDTH of 768', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith(`(max-width: ${MOBILE_VIEW_MAX_WIDTH - 1}px)`);
    });
  });

  describe('custom max width', () => {
    it('should accept a custom max width parameter', () => {
      const customMaxWidth = 1024;
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile(customMaxWidth), { wrapper });

      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith(`(max-width: ${customMaxWidth - 1}px)`);
    });

    it('should return false when width is above custom max width', () => {
      const customMaxWidth = 500;
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const { result } = renderHook(() => useIsMobile(customMaxWidth), { wrapper });

      expect(result.current).toBe(false);
    });
  });

  describe('media query listener', () => {
    it('should set up a media query listener', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderHook(() => useIsMobile(), { wrapper });

      expect(matchMediaMock).toHaveBeenCalledWith(`(max-width: ${MOBILE_VIEW_MAX_WIDTH - 1}px)`);
      expect(listeners.length).toBe(1);
    });

    it('should update isMobile when window is resized', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result, rerender } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(false);

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      // Trigger the media query change event
      act(() => {
        listeners.forEach(listener => {
          listener({} as MediaQueryListEvent);
        });
      });

      rerender();

      expect(result.current).toBe(true);
    });

    it('should clean up the event listener on unmount', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { unmount } = renderHook(() => useIsMobile(), { wrapper });

      expect(listeners.length).toBe(1);

      unmount();

      expect(listeners.length).toBe(0);
    });
  });

  describe('max width changes', () => {
    it('should re-initialize when maxWidth prop changes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { result, rerender } = renderHook(({ maxWidth }) => useIsMobile(maxWidth), {
        initialProps: { maxWidth: 768 },
      });

      expect(result.current).toBe(false);

      // Change maxWidth to 1024
      rerender({ maxWidth: 1024 });

      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenLastCalledWith('(max-width: 1023px)');
    });
  });

  describe('server-side rendering support', () => {
    it('should use atom value when server provides mobile state', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile(), {
        wrapper: ({ children }) => (
          <TestAtomStoreProvider initialValues={[[serverIsMobileAtom, true]]}>
            {children}
          </TestAtomStoreProvider>
        ),
      });

      // After useEffect runs, it updates to match actual window width
      // window.innerWidth (1024) >= MOBILE_VIEW_MAX_WIDTH (768), so it should be false
      expect(result.current).toBe(false);
    });

    it('should maintain backwards compatibility with number parameter', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile(1024), { wrapper });

      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 1023px)');
    });

    it('should use server atom value when it matches client width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile(), {
        wrapper: ({ children }) => (
          <TestAtomStoreProvider initialValues={[[serverIsMobileAtom, true]]}>
            {children}
          </TestAtomStoreProvider>
        ),
      });

      // After useEffect runs, it confirms mobile (500 < 768)
      expect(result.current).toBe(true);
    });

    it('should work without server value', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(true);
    });
  });
});
