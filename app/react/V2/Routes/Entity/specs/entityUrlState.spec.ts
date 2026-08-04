/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { parseEntityHash, serializeEntityHash, useUpdateEntityUrl } from '../entityUrlState.js';

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
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(MemoryRouter, { initialEntries: [initial] }, children),
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
      const [to, opts] = mockNavigate.mock.calls[0];
      expect(to.pathname).toBe('/entity/1');
      expect(to.search).not.toContain('m=');
      expect(to.hash).toContain('page=4');
      expect(to.hash).toContain('s=search');
      expect(opts).toEqual({ replace: true, preventScrollReset: true });
    });

    it('does not call history.replaceState', async () => {
      const initial = '/entity/1?m=metadata#s=search&page=3';
      window.history.replaceState({}, '', initial);
      const replaceStateSpy = jest.spyOn(window.history, 'replaceState');
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(MemoryRouter, { initialEntries: [initial] }, children),
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

      expect(replaceStateSpy).not.toHaveBeenCalled();
      replaceStateSpy.mockRestore();
    });

    it('drops pending batch when pathname changes before flush', async () => {
      window.history.replaceState({}, '', '/entity/1#s=search');
      const { result } = renderHook(() => useUpdateEntityUrl(), {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(MemoryRouter, { initialEntries: ['/entity/1#s=search'] }, children),
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
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(MemoryRouter, { initialEntries: ['/'] }, children),
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
      const [to] = mockNavigate.mock.calls[0];
      expect(to.pathname).toBe('/');
      expect(to.search).toContain('m=files');
    });
  });
});
