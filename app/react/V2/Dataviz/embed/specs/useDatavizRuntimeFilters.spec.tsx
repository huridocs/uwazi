/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { DATAVIZ_FILTER_EVENT } from '#shared/types/datavizSchema.js';
import { useDatavizRuntimeFilters } from '../useDatavizRuntimeFilters.js';

const dispatchFilter = (detail: Record<string, unknown>) => {
  document.dispatchEvent(new CustomEvent(DATAVIZ_FILTER_EVENT, { detail }));
};

describe('useDatavizRuntimeFilters', () => {
  it('should start with no filters', () => {
    const { result } = renderHook(() => useDatavizRuntimeFilters('chartA'));
    expect(result.current).toEqual([]);
  });

  it('should accumulate filters by property', () => {
    const { result } = renderHook(() => useDatavizRuntimeFilters('chartA'));

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        property: 'mileage',
        value: { max: 80000 },
      });
    });

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        property: 'colors',
        value: { values: ['color_black'] },
      });
    });

    expect(result.current).toEqual(
      expect.arrayContaining([
        { property: 'mileage', value: { max: 80000 } },
        { property: 'colors', value: { values: ['color_black'] } },
      ])
    );
    expect(result.current).toHaveLength(2);
  });

  it('should clear a property when value is null or undefined', () => {
    const { result } = renderHook(() => useDatavizRuntimeFilters('chartA'));

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        property: 'mileage',
        value: { max: 80000 },
      });
      dispatchFilter({
        targets: ['chartA'],
        property: 'colors',
        value: { values: ['color_black'] },
      });
    });

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        property: 'mileage',
        value: null,
      });
    });

    expect(result.current).toEqual([{ property: 'colors', value: { values: ['color_black'] } }]);

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        property: 'colors',
        value: undefined,
      });
    });

    expect(result.current).toEqual([]);
  });

  it('should ignore events that target other charts', () => {
    const { result } = renderHook(() => useDatavizRuntimeFilters('chartA'));

    act(() => {
      dispatchFilter({
        targets: ['chartB'],
        property: 'mileage',
        value: { max: 1000 },
      });
    });

    expect(result.current).toEqual([]);
  });

  it('should accept broadcast targets (* or omitted)', () => {
    const { result } = renderHook(() => useDatavizRuntimeFilters('chartA'));

    act(() => {
      dispatchFilter({
        targets: '*',
        property: 'mileage',
        value: { max: 1000 },
      });
    });

    expect(result.current).toEqual([{ property: 'mileage', value: { max: 1000 } }]);

    act(() => {
      dispatchFilter({
        property: 'colors',
        value: { values: ['color_red'] },
      });
    });

    expect(result.current).toEqual(
      expect.arrayContaining([
        { property: 'mileage', value: { max: 1000 } },
        { property: 'colors', value: { values: ['color_red'] } },
      ])
    );
  });

  it('should prefer per-chart property overrides', () => {
    const { result } = renderHook(() => useDatavizRuntimeFilters('chartA'));

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        property: 'edad',
        properties: { chartA: 'altura' },
        value: { min: 20, max: 40 },
      });
    });

    expect(result.current).toEqual([{ property: 'altura', value: { min: 20, max: 40 } }]);
  });

  it('should ignore events without a property key', () => {
    const { result } = renderHook(() => useDatavizRuntimeFilters('chartA'));

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        value: { max: 10 },
      });
    });

    expect(result.current).toEqual([]);
  });

  it('should stop listening after unmount', () => {
    const { result, unmount } = renderHook(() => useDatavizRuntimeFilters('chartA'));

    unmount();

    act(() => {
      dispatchFilter({
        targets: ['chartA'],
        property: 'mileage',
        value: { max: 10 },
      });
    });

    expect(result.current).toEqual([]);
  });
});
