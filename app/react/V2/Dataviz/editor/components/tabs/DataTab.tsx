import React, { useCallback } from 'react';
import type { DatavizDefinition, DimensionSpec } from '#V2/Dataviz/types/definition.js';
import { isTwoDimensionalQuery } from '#V2/Dataviz/utils/twoDimensionalQuery.js';
import { DataSourcesList } from '../data/sources/DataSourcesList.js';
import { FiltersSection } from '../data/filters/FiltersSection.js';
import { DimensionSection } from '../data/DimensionSection.js';
import { MeasureSection } from '../data/MeasureSection.js';
import { SupportedChartTypesCallout } from '../data/SupportedChartTypesCallout.js';

type DataTabProps = {
  definition: DatavizDefinition;
  onPatchQuery: (patch: Partial<DatavizDefinition['query']>) => void;
  onPatchChart?: (patch: Partial<DatavizDefinition['chart']>) => void;
};

const DataTab = ({ definition, onPatchQuery, onPatchChart }: DataTabProps) => {
  const { query, chart } = definition;
  const primaryDimension = query.dimensions[0];
  const secondaryDimension = query.dimensions[1];
  const measure = query.measures[0] || { aggregation: 'count' as const, countMode: 'all' as const };

  const setDimensions = useCallback(
    (primary?: DimensionSpec, secondary?: DimensionSpec) => {
      const dimensions = [primary, secondary].filter((d): d is DimensionSpec => Boolean(d));
      onPatchQuery({ dimensions });

      const willBeTwoD = dimensions.length >= 2;
      if (willBeTwoD && chart.type !== 'stacked_bar' && onPatchChart) {
        onPatchChart({ type: 'stacked_bar', stacked: true, showLegend: true });
      }
      if (!willBeTwoD && chart.type === 'stacked_bar' && onPatchChart) {
        onPatchChart({ type: 'bar' });
      }
    },
    [onPatchQuery, onPatchChart, chart.type]
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <DataSourcesList
        sources={query.sources}
        onChange={sources =>
          onPatchQuery({
            sources,
            join: sources.length > 1 ? { type: 'union' } : undefined,
          })
        }
      />
      <FiltersSection
        filters={query.filters || []}
        sources={query.sources}
        onChange={filters => onPatchQuery({ filters })}
      />
      <DimensionSection
        sources={query.sources}
        dimension={primaryDimension}
        onChange={dim => setDimensions(dim, secondaryDimension)}
        title="Primary dimension (X-axis / categories)"
        idPrefix="primary-dimension"
        allowTemplateDimension
      />
      <DimensionSection
        sources={query.sources}
        dimension={secondaryDimension}
        onChange={dim => setDimensions(primaryDimension, dim)}
        title="Second dimension (series / stacks)"
        idPrefix="secondary-dimension"
        excludedProperties={primaryDimension?.property ? [primaryDimension.property] : []}
        allowTemplateDimension={false}
        allowNone
      />
      {isTwoDimensionalQuery(query.dimensions) && (
        <p className="text-xs text-ink-secondary">
          Two categorical dimensions enable stacked bar charts (e.g. country with sex breakdown).
        </p>
      )}
      <MeasureSection measure={measure} onChange={m => onPatchQuery({ measures: [m] })} />
      <SupportedChartTypesCallout dimensions={query.dimensions} measures={query.measures} />
      <p className="text-xs text-ink-muted">Preview updates automatically (300ms debounce)</p>
    </div>
  );
};

export { DataTab };
