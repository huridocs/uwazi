import {
  applyDatavizFilterEvent,
  runtimeFiltersFromRecord,
} from '#shared/dataviz/applyDatavizFilterEvent.js';
import type { DatavizFilterEventDetail } from '#shared/types/datavizSchema.js';

describe('applyDatavizFilterEvent', () => {
  it('should return null when the chart is not targeted', () => {
    expect(
      applyDatavizFilterEvent({}, 'chartA', {
        targets: ['chartB'],
        property: 'mileage',
        value: { max: 10 },
      })
    ).toBeNull();
  });

  it('should accumulate and clear property slots', () => {
    const withMileage = applyDatavizFilterEvent({}, 'chartA', {
      targets: ['chartA'],
      property: 'mileage',
      value: { max: 80000 },
    });

    expect(withMileage).toEqual({ mileage: { max: 80000 } });

    const withBoth = applyDatavizFilterEvent(withMileage!, 'chartA', {
      property: 'colors',
      value: { values: ['color_black'] },
    });

    expect(withBoth).toEqual({
      mileage: { max: 80000 },
      colors: { values: ['color_black'] },
    });

    const cleared = applyDatavizFilterEvent(withBoth!, 'chartA', {
      property: 'mileage',
      value: null,
    });

    expect(cleared).toEqual({ colors: { values: ['color_black'] } });
  });

  it('should prefer per-chart property overrides', () => {
    const next = applyDatavizFilterEvent({}, 'chartA', {
      targets: '*',
      property: 'edad',
      properties: { chartA: 'altura' },
      value: { min: 20, max: 40 },
    } satisfies DatavizFilterEventDetail);

    expect(next).toEqual({ altura: { min: 20, max: 40 } });
  });

  it('should map records to runtime filter arrays', () => {
    expect(runtimeFiltersFromRecord({ mileage: { max: 1 }, colors: { values: ['a'] } })).toEqual([
      { property: 'mileage', value: { max: 1 } },
      { property: 'colors', value: { values: ['a'] } },
    ]);
  });
});
