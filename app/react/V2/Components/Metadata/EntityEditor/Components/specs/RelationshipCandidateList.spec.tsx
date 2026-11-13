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
