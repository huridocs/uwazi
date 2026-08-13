import type { EChartsOption } from 'echarts';

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Lodash-compatible deep merge for ECharts option overrides.
 * - Plain objects are merged recursively
 * - Arrays are merged by index (same as `_.merge`)
 * - `undefined` source values are skipped
 */
const deepMerge = <T>(target: T, source: unknown): T => {
  if (!isObject(source)) {
    return (source === undefined ? target : source) as T;
  }

  const output: Record<string, unknown> = isObject(target) ? { ...target } : {};

  Object.keys(source).forEach(key => {
    const sourceValue = source[key];
    if (sourceValue === undefined) {
      return;
    }

    const targetValue = output[key];

    if (Array.isArray(sourceValue)) {
      const baseArray = Array.isArray(targetValue) ? [...targetValue] : [];
      const length = Math.max(baseArray.length, sourceValue.length);
      output[key] = Array.from({ length }, (_, index) => {
        if (index >= sourceValue.length) {
          return baseArray[index];
        }
        return deepMerge(baseArray[index], sourceValue[index]);
      });
      return;
    }

    if (isObject(sourceValue)) {
      output[key] = deepMerge(isObject(targetValue) ? targetValue : {}, sourceValue);
      return;
    }

    output[key] = sourceValue;
  });

  return output as T;
};

const mergeEChartsOption = (
  base: EChartsOption,
  overrides?: Record<string, unknown>
): EChartsOption => {
  if (!overrides || Object.keys(overrides).length === 0) {
    return base;
  }
  // Equivalent to `_.merge({}, base, overrides)`.
  return deepMerge(deepMerge({}, base), overrides) as EChartsOption;
};

export { mergeEChartsOption, deepMerge };
