import { buildValueAxis, computePaddedAxisBounds, formatValueAxisTick } from '../valueAxis.js';
import { computeYearAxisBounds } from '#V2/Dataviz/utils/scatterDateAxis.js';

describe('buildValueAxis', () => {
  it('should include zero baseline by default', () => {
    expect(buildValueAxis({ axisLabelColor: '#111' })).toEqual({
      type: 'value',
      axisLabel: { color: '#111' },
    });
  });

  it('should fit axis to data when scale is enabled', () => {
    expect(buildValueAxis({ scale: true, min: 1995, max: 2006 })).toEqual({
      type: 'value',
      scale: true,
      min: 1995,
      max: 2006,
      axisLabel: { color: undefined },
    });
  });
});

describe('computeYearAxisBounds', () => {
  it('should snap year axes to half-year padding', () => {
    expect(computeYearAxisBounds([1996, 2005])).toEqual({
      min: 1995.5,
      max: 2005.5,
    });
  });
});

describe('computePaddedAxisBounds', () => {
  it('should pad year ranges around data', () => {
    expect(computePaddedAxisBounds([1996, 2005])).toEqual({
      min: 1996 - 0.72,
      max: 2005 + 0.72,
    });
  });
});

describe('formatValueAxisTick', () => {
  it('should round noisy decimals on axis ticks', () => {
    expect(formatValueAxisTick(1.7999999999999998)).toBe('1.8');
  });

  it('should keep integer years as-is', () => {
    expect(formatValueAxisTick(2000)).toBe('2000');
  });
});
