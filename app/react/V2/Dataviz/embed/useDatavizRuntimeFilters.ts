import { useEffect, useState } from 'react';
import {
  DATAVIZ_FILTER_EVENT,
  type DatavizFilterEventDetail,
  type DatavizRuntimeFilter,
  type DatavizRuntimeFilterValue,
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

const useDatavizRuntimeFilters = (chartId: string): DatavizRuntimeFilter[] => {
  const [filtersByProperty, setFiltersByProperty] = useState<
    Record<string, DatavizRuntimeFilterValue>
  >({});

  useEffect(() => {
    const onFilterEvent = (event: Event) => {
      const customEvent = event as CustomEvent<DatavizFilterEventDetail>;
      const detail = customEvent.detail;
      if (!detail || !isTargeted(chartId, detail.targets)) {
        return;
      }

      const propertyKey = resolvePropertyKey(chartId, detail);
      if (!propertyKey) {
        return;
      }

      setFiltersByProperty(previous => {
        const next = { ...previous };
        if (detail.value === null || detail.value === undefined) {
          delete next[propertyKey];
        } else {
          next[propertyKey] = detail.value;
        }
        return next;
      });
    };

    document.addEventListener(DATAVIZ_FILTER_EVENT, onFilterEvent);
    return () => document.removeEventListener(DATAVIZ_FILTER_EVENT, onFilterEvent);
  }, [chartId]);

  return Object.entries(filtersByProperty).map(([property, value]) => ({ property, value }));
};

export { useDatavizRuntimeFilters };
