/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'jotai';
import {
  parseEntityHash,
  serializeEntityHash,
  useEntityDocumentPage,
  useUpdateEntityUrl,
  EntityUrlSync,
} from '../entityUrlState.js';

const mockNavigate = jest.fn();

jest.mock('react-router', () => {
  const actual = jest.requireActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('entityUrlState', () => {
  describe('parseEntityHash / serializeEntityHash', () => {
    it('parses and serializes hash params', () => {
      const parsed = parseEntityHash('#page=5&s=toc');
      expect(parsed.get('page')).toBe('5');
      expect(parsed.get('s')).toBe('toc');
      expect(serializeEntityHash(parsed)).toBe('#page=5&s=toc');
    });

    it('returns empty string for empty params', () => {
      expect(serializeEntityHash(new URLSearchParams())).toBe('');
    });
  });

  describe('useUpdateEntityUrl coalescing', () => {
    const wrapper =
      (initial: string) =>
      ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          MemoryRouter,
          { initialEntries: [initial] },
          React.createElement(Provider, null, React.createElement(EntityUrlSync, null, children))
        );

    beforeEach(() => {
      mockNavigate.mockClear();
      window.history.replaceState({}, '', '/entity/1?m=metadata#s=search&page=3');
    });

    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    // eslint-disable-next-line max-statements
    it('merges same-tick tab and page hash updates into one navigate', async () => {
      const initial = '/entity/1?m=metadata#s=search&page=3';
      window.history.replaceState({}, '', initial);
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: wrapper(initial),
      });

      act(() => {
        result.current({
          search: next => {
            next.delete('m');
          },
          hash: next => {
            next.set('s', 'search');
          },
        });
        result.current({
          hash: next => {
            next.set('page', '4');
          },
        });
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      const [[to, opts]] = mockNavigate.mock.calls;
      expect(to.pathname).toBe('/entity/1');
      expect(to.search).not.toContain('m=');
      expect(to.hash).toContain('page=4');
      expect(to.hash).toContain('s=search');
      expect(opts).toEqual({ replace: true, preventScrollReset: true });
    });

    it('exposes the hash page on the first render', () => {
      const pages: number[] = [];
      const { result } = renderHook(
        () => {
          const page = useEntityDocumentPage();
          pages.push(page);
          return page;
        },
        { wrapper: wrapper('/entity/1#page=5') }
      );
      expect(pages[0]).toBe(5);
      expect(result.current).toBe(5);
    });

    it('uses history.replaceState for page-only hash updates', async () => {
      const initial = '/entity/1?m=metadata#s=search&page=3';
      window.history.replaceState({}, '', initial);
      const replaceStateSpy = jest.spyOn(History.prototype, 'replaceState');
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: wrapper(initial),
      });

      act(() => {
        result.current({
          hash: next => {
            next.set('page', '2');
          },
        });
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(replaceStateSpy).toHaveBeenCalled();
      replaceStateSpy.mockRestore();
    });

    it('keeps the atom page after a page-only replaceState', async () => {
      const initial = '/entity/1?m=metadata#s=search&page=3';
      window.history.replaceState({}, '', initial);
      const { result } = renderHook(
        () => ({ update: useUpdateEntityUrl(), page: useEntityDocumentPage() }),
        { wrapper: wrapper(initial) }
      );

      act(() => {
        result.current.update({
          hash: next => {
            next.set('page', '2');
          },
        });
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.page).toBe(2);
    });

    it('can return to the router-stale page after a page-only replaceState', async () => {
      const initial = '/entity/1?m=metadata#s=search&page=3';
      window.history.replaceState({}, '', initial);
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: wrapper(initial),
      });

      act(() => {
        result.current({
          hash: next => {
            next.set('page', '2');
          },
        });
      });
      await act(async () => {
        await Promise.resolve();
      });
      mockNavigate.mockClear();

      act(() => {
        result.current({
          hash: next => {
            next.set('page', '3');
          },
        });
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.hash).toContain('page=3');
    });

    it('keeps the atom page when changing hash ui after a page-only replaceState', async () => {
      const initial = '/entity/1?m=metadata#s=search&page=3';
      window.history.replaceState({}, '', initial);
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: wrapper(initial),
      });

      act(() => {
        result.current({
          hash: next => {
            next.set('page', '2');
          },
        });
      });
      await act(async () => {
        await Promise.resolve();
      });
      mockNavigate.mockClear();

      act(() => {
        result.current({
          hash: next => {
            next.set('s', 'toc');
          },
        });
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      const [[to]] = mockNavigate.mock.calls;
      expect(to.hash).toContain('page=2');
      expect(to.hash).toContain('s=toc');
    });

    it('drops pending batch when pathname changes before flush', async () => {
      window.history.replaceState({}, '', '/entity/1#s=search');
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: wrapper('/entity/1#s=search'),
      });

      act(() => {
        result.current({
          hash: next => {
            next.set('page', '7');
            next.set('searchTerm', 'court');
          },
        });
        window.history.replaceState({}, '', '/library');
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('applies against React location when window path differs but is stable (MemoryRouter)', async () => {
      window.history.replaceState({}, '', '/__cypress/src/index.html');
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: wrapper('/'),
      });

      act(() => {
        result.current({
          search: next => {
            next.set('m', 'files');
          },
        });
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      const [[to]] = mockNavigate.mock.calls;
      expect(to.pathname).toBe('/');
      expect(to.search).toContain('m=files');
    });

    it('keeps React hash when window hash is stale but pathname matches', async () => {
      window.history.replaceState({}, '', '/entity/1');
      const initial = '/entity/1?m=metadata#s=relationships';
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: wrapper(initial),
      });

      act(() => {
        result.current({
          search: next => {
            next.delete('m');
          },
        });
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      const [[to]] = mockNavigate.mock.calls;
      expect(to.search).not.toContain('m=');
      expect(to.hash).toContain('s=relationships');
    });
  });
});
