import { deepMerge, mergeEChartsOption } from '../mergeEChartsOption.js';

describe('mergeEChartsOption', () => {
  it('should return the base option when overrides are empty', () => {
    const base = { title: { text: 'Cars' }, color: ['#f00'] };
    expect(mergeEChartsOption(base, undefined)).toBe(base);
    expect(mergeEChartsOption(base, {})).toBe(base);
  });

  it('should deep-merge nested objects like lodash merge', () => {
    const base = {
      legend: { show: true, orient: 'vertical' },
      series: [{ type: 'pie', radius: '70%' }],
    };
    const merged = mergeEChartsOption(base, {
      legend: { show: false },
      tooltip: { trigger: 'item' },
    });

    expect(merged).toEqual({
      legend: { show: false, orient: 'vertical' },
      series: [{ type: 'pie', radius: '70%' }],
      tooltip: { trigger: 'item' },
    });
    expect(merged).not.toBe(base);
  });

  it('should merge arrays by index like lodash merge', () => {
    expect(
      deepMerge({ series: [{ type: 'pie', name: 'A' }] }, { series: [{ name: 'B' }] })
    ).toEqual({ series: [{ type: 'pie', name: 'B' }] });

    expect(deepMerge({ series: [1, 2, 3] }, { series: [4] })).toEqual({ series: [4, 2, 3] });
  });

  it('should skip undefined override values', () => {
    expect(deepMerge({ a: 1, b: 2 }, { a: undefined, b: 3 })).toEqual({ a: 1, b: 3 });
  });
});
