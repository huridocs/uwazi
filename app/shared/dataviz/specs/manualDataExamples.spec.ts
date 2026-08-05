import {
  getManualExampleForChartType,
  MANUAL_EXAMPLE_BY_CHART_TYPE,
} from '../manualDataExamples.js';
import { EDITOR_CHART_TYPES } from '#V2/Dataviz/types/chartTypes.js';

describe('manualDataExamples', () => {
  it('should provide an example payload for every editor chart type', () => {
    EDITOR_CHART_TYPES.forEach(chartType => {
      const example = getManualExampleForChartType(chartType);
      expect(example.series.length).toBeGreaterThan(0);
      expect(example.series[0]?.points.length).toBeGreaterThan(0);
      expect(MANUAL_EXAMPLE_BY_CHART_TYPE[chartType]).toBeDefined();
    });
  });

  it('should return independent copies when loading examples', () => {
    const first = getManualExampleForChartType('bar');
    first.series[0]!.points[0]!.value = 0;
    const second = getManualExampleForChartType('bar');
    expect(second.series[0]?.points[0]?.value).not.toBe(0);
  });
});
