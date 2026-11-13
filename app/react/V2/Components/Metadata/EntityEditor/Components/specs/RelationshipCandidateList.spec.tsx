/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRelationshipCandidates } from '../RelationshipCandidateList.js';

const page = (label: string, value: string) => ({
  options: [{ label, searchLabel: label.toLowerCase(), value }],
  total: 1,
  fetched: 1,
});

describe('useRelationshipCandidates', () => {
  it('sorts the matches alphabetically', async () => {
    const lookupSearch = jest.fn(async () => ({
      options: [
        { label: 'Zeta', searchLabel: 'zeta', value: 'z' },
        { label: 'alpha', searchLabel: 'alpha', value: 'a' },
      ],
      total: 2,
      fetched: 2,
    }));

    const { result } = renderHook(() =>
      useRelationshipCandidates({ lookupSearch, selectedIds: [], adding: true, query: '' })
    );

    await waitFor(() =>
      expect(result.current.candidates.map(option => option.value)).toEqual(['a', 'z'])
    );
  });

  it('drops a search that returns after a newer query', async () => {
    jest.useFakeTimers();
    let resolveEmpty: (value: ReturnType<typeof page>) => void = () => undefined;
    const lookupSearch = jest.fn((search: string) => {
      if (search === 'MULTI') {
        return Promise.resolve(page('MULTINATIONAL', 'm'));
      }
      return new Promise<ReturnType<typeof page>>(resolve => {
        resolveEmpty = resolve;
      });
    });

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useRelationshipCandidates({ lookupSearch, selectedIds: [], adding: true, query }),
      { initialProps: { query: '' } }
    );

    rerender({ query: 'MULTI' });
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.candidates.map(option => option.value)).toEqual(['m']);

    await act(async () => {
      resolveEmpty(page('Other', 'o'));
      await Promise.resolve();
    });

    expect(result.current.candidates.map(option => option.value)).toEqual(['m']);
    jest.useRealTimers();
  });

  it('puts a removed selection back into the open list', async () => {
    const lookupSearch = jest.fn(async () => ({
      options: [
        { label: 'Alpha', searchLabel: 'alpha', value: 'a' },
        { label: 'Beta', searchLabel: 'beta', value: 'b' },
      ],
      total: 2,
      fetched: 2,
    }));
    const { result, rerender } = renderHook(
      ({ selectedIds }: { selectedIds: string[] }) =>
        useRelationshipCandidates({ lookupSearch, selectedIds, adding: true, query: '' }),
      { initialProps: { selectedIds: ['a'] } }
    );

    await waitFor(() =>
      expect(result.current.candidates.map(option => option.value)).toEqual(['b'])
    );
    rerender({ selectedIds: [] });
    await waitFor(() =>
      expect(result.current.candidates.map(option => option.value)).toEqual(['a', 'b'])
    );
  });

  it('drops a load-more page that finishes after the query changes', async () => {
    jest.useFakeTimers();
    let resolveMore: (value: ReturnType<typeof page>) => void = () => undefined;
    const lookupSearch = jest.fn((search: string, offset = 0) => {
      if (offset > 0) {
        return new Promise<ReturnType<typeof page>>(resolve => {
          resolveMore = resolve;
        });
      }
      return Promise.resolve(
        search === 'MULTI'
          ? {
              options: [{ label: 'MULTINATIONAL', searchLabel: 'multi', value: 'm' }],
              total: 2,
              fetched: 1,
            }
          : {
              options: [{ label: 'Alpha', searchLabel: 'alpha', value: 'a' }],
              total: 3,
              fetched: 1,
            }
      );
    });
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useRelationshipCandidates({ lookupSearch, selectedIds: [], adding: true, query }),
      { initialProps: { query: '' } }
    );

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      result.current.loadMore();
    });
    rerender({ query: 'MULTI' });
    await act(async () => {
      resolveMore(page('Other', 'o'));
      await Promise.resolve();
    });

    expect(result.current.candidates.map(option => option.value)).toEqual(['a']);
    jest.useRealTimers();
  });

  it('keeps the full list when a typed search is cleared before it runs', async () => {
    jest.useFakeTimers();
    const lookupSearch = jest.fn((search: string) =>
      Promise.resolve(search === 'MULTI' ? page('MULTINATIONAL', 'm') : page('Other', 'o'))
    );
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useRelationshipCandidates({ lookupSearch, selectedIds: [], adding: true, query }),
      { initialProps: { query: '' } }
    );

    await act(async () => {
      await Promise.resolve();
    });
    rerender({ query: 'MULTI' });
    rerender({ query: '' });
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.candidates.map(option => option.value)).toEqual(['o']);
    jest.useRealTimers();
  });
});
