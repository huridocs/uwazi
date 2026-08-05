import { useEffect, useState } from 'react';
import {
  applyDatavizFilterEvent,
  runtimeFiltersFromRecord,
} from '#shared/dataviz/applyDatavizFilterEvent.js';
import {
  DATAVIZ_FILTER_EVENT,
  type DatavizFilterEventDetail,
  type DatavizRuntimeFilter,
  type DatavizRuntimeFilterValue,
} from '#shared/types/datavizSchema.js';

const useDatavizRuntimeFilters = (chartId: string): DatavizRuntimeFilter[] => {
  const [filtersByProperty, setFiltersByProperty] = useState<
    Record<string, DatavizRuntimeFilterValue>
  >({});

  useEffect(() => {
    const onFilterEvent = (event: Event) => {
      const customEvent = event as CustomEvent<DatavizFilterEventDetail>;
      setFiltersByProperty(previous => {
        const next = applyDatavizFilterEvent(previous, chartId, customEvent.detail);
        return next ?? previous;
      });
    };

    document.addEventListener(DATAVIZ_FILTER_EVENT, onFilterEvent);
    return () => document.removeEventListener(DATAVIZ_FILTER_EVENT, onFilterEvent);
  }, [chartId]);

  return runtimeFiltersFromRecord(filtersByProperty);
};

export { useDatavizRuntimeFilters };
