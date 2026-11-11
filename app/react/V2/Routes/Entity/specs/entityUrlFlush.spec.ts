/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'jotai';
import {
  useEntityDocumentPage,
  useEntityHashUiParams,
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

const wrapper =
  (initial: string) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      MemoryRouter,
      { initialEntries: [initial] },
      React.createElement(Provider, null, React.createElement(EntityUrlSync, null, children))
    );

const expectNavigatedHash = (parts: string[]) => {
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  const [[to]] = mockNavigate.mock.calls;
  parts.forEach(part => {
    expect(`${to.search}${to.hash}`).toContain(part);
  });
};

describe('entity url flush', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    window.history.replaceState({}, '', '/entity/1?m=metadata#s=search&page=3');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
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

  it('applies against React location when window path differs but is stable', async () => {
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

  it('keeps page and searchTerm when the side tab is written again', async () => {
    const initial = '/entity/1#s=metadata&page=1&searchTerm=Human';
    window.history.replaceState({}, '', initial);
    const { result } = renderHook(
      () => ({
        update: useUpdateEntityUrl(),
        page: useEntityDocumentPage(),
        hash: useEntityHashUiParams(),
      }),
      { wrapper: wrapper(initial) }
    );

    expect(result.current.page).toBe(1);
    expect(result.current.hash.get('s')).toBe('metadata');
    expect(result.current.hash.get('searchTerm')).toBe('Human');
    expect(result.current.hash.get('page')).toBeNull();

    act(() => {
      result.current.update({
        hash: next => {
          next.set('s', 'document');
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expectNavigatedHash(['s=document', 'page=1', 'searchTerm=Human']);
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
