import _ from 'lodash';
import type { EChartsOption } from 'echarts';

const mergeEChartsOption = (
  base: EChartsOption,
  overrides?: Record<string, unknown>
): EChartsOption => {
  if (!overrides || Object.keys(overrides).length === 0) {
    return base;
  }
  return _.merge({}, base, overrides) as EChartsOption;
};

export { mergeEChartsOption };
