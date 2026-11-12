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
  useEntitySearchParams,
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

    it('keeps side tab, page, and search term in one hash', () => {
      const parsed = parseEntityHash('#s=metadata&page=1&searchTerm=Human');

      expect(parsed.get('s')).toBe('metadata');
      expect(parsed.get('page')).toBe('1');
      expect(parsed.get('searchTerm')).toBe('Human');
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

    it('keeps an isolated session off the router', async () => {
      const replaceState = jest.spyOn(History.prototype, 'replaceState');
      const initial = '/en/library?q=court&m=metadata#s=file&page=4';
      window.history.replaceState({}, '', initial);
      replaceState.mockClear();
      const isolated = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          MemoryRouter,
          { initialEntries: [initial] },
          React.createElement(
            Provider,
            null,
            React.createElement(EntityUrlSync, { isolated: true }, children)
          )
        );
      const { result } = renderHook(
        () => ({
          update: useUpdateEntityUrl(),
          search: useEntitySearchParams(),
          page: useEntityDocumentPage(),
        }),
        { wrapper: isolated }
      );

      expect(result.current.search.get('m')).toBeNull();
      expect(result.current.search.get('q')).toBeNull();

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

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(result.current.page).toBe(2);
      replaceState.mockRestore();
    });
  });
});
