import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { CHART_TYPE_LABELS } from '#V2/Dataviz/types/chartTypes.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { getSupportedChartTypes } from '#V2/Dataviz/utils/getSupportedChartTypes.js';
import type {
  DatavizDataSourceKind,
  DimensionSpec,
  MeasureSpec,
} from '#V2/Dataviz/types/definition.js';

type SupportedChartTypesCalloutProps = {
  dimensions: DimensionSpec[];
  measures: MeasureSpec[];
  dataSource?: DatavizDataSourceKind;
};

const SupportedChartTypesCallout = ({
  dimensions,
  measures,
  dataSource,
}: SupportedChartTypesCalloutProps) => {
  const isManual = isManualDataSource(dataSource);
  const supported = getSupportedChartTypes(dimensions, measures, { isManual }).filter(
    item => item.enabled
  );

  if (isManual) {
    return (
      <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-ink">
        <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="font-medium">
            <Translate>Supported chart types for manual data</Translate>
          </p>
          <p className="mt-1 text-ink-secondary">
            {supported.map(s => CHART_TYPE_LABELS[s.type]).join(', ') || 'None'}
          </p>
        </div>
      </div>
    );
  }

  if (!dimensions.length) {
    return (
      <div className="flex gap-2 rounded-lg border border-border bg-vellum p-3 text-sm text-ink-secondary">
        <InformationCircleIcon className="h-5 w-5 shrink-0" />
        <span>
          <Translate>
            Select a dimension to see supported chart types, or use Metric for a total count.
          </Translate>
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-ink">
      <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-600" />
      <div>
        <p className="font-medium">
          <Translate>Supported chart types for this configuration</Translate>
        </p>
        <p className="mt-1 text-ink-secondary">
          {supported.map(s => CHART_TYPE_LABELS[s.type]).join(', ') || 'None'}
        </p>
      </div>
    </div>
  );
};

export { SupportedChartTypesCallout };
