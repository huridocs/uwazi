/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'jotai';
import { EntityUrlSync, useUpdateEntityUrl } from '../entityUrlState.js';

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

describe('entity URL session unbind', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    window.history.replaceState({}, '', '/entity/1?m=metadata#s=search');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('does not apply URL updates after EntityUrlSync unmounts', async () => {
    const { result, unmount } = renderHook(() => useUpdateEntityUrl(), {
      wrapper: wrapper('/entity/1?m=metadata#s=search'),
    });
    unmount();
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
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('drops a queued URL flush when EntityUrlSync unmounts', async () => {
    const { result, unmount } = renderHook(() => useUpdateEntityUrl(), {
      wrapper: wrapper('/entity/1?m=metadata#s=search'),
    });
    act(() => {
      result.current({
        search: next => {
          next.set('m', 'files');
        },
      });
      unmount();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
