import type {
  DatavizFilterEventDetail,
  DatavizRuntimeFilter,
  DatavizRuntimeFilterValue,
} from '#shared/types/datavizSchema.js';

const isTargeted = (chartId: string, targets: DatavizFilterEventDetail['targets']): boolean => {
  if (targets === undefined || targets === '*') {
    return true;
  }
  return Array.isArray(targets) && targets.includes(chartId);
};

const resolvePropertyKey = (
  chartId: string,
  detail: DatavizFilterEventDetail
): string | undefined => detail.properties?.[chartId] ?? detail.property;

/**
 * Apply a filter event to an accumulated property→value map.
 * Returns `null` when the event does not target this chart (or has no property key).
 */
const applyDatavizFilterEvent = (
  previous: Record<string, DatavizRuntimeFilterValue>,
  chartId: string,
  detail: DatavizFilterEventDetail | null | undefined
): Record<string, DatavizRuntimeFilterValue> | null => {
  if (!detail || !isTargeted(chartId, detail.targets)) {
    return null;
  }

  const propertyKey = resolvePropertyKey(chartId, detail);
  if (!propertyKey) {
    return null;
  }

  const next = { ...previous };
  if (detail.value === null || detail.value === undefined) {
    delete next[propertyKey];
  } else {
    next[propertyKey] = detail.value;
  }
  return next;
};

const runtimeFiltersFromRecord = (
  filtersByProperty: Record<string, DatavizRuntimeFilterValue>
): DatavizRuntimeFilter[] =>
  Object.entries(filtersByProperty).map(([property, value]) => ({ property, value }));

export { applyDatavizFilterEvent, runtimeFiltersFromRecord };
