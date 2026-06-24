import React, { useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import type {
  DatavizDataSourceKind,
  DatavizDefinition,
  DimensionSpec,
  MeasureSpec,
} from '#V2/Dataviz/types/definition.js';
import type { ClientTemplateSchema } from '#app/istore.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { isManualDataSource, MANUAL_DATA_EXAMPLE } from '#shared/dataviz/manualData.js';
import { isTwoDimensionalQuery } from '#V2/Dataviz/utils/twoDimensionalQuery.js';
import { resolveChartPatchForQuery } from '#V2/Dataviz/utils/resolveChartPatchForQuery.js';
import { ensureSourceAliases } from '#V2/Dataviz/utils/ensureSourceAliases.js';
import { sanitizeDimensionsForSources } from '#V2/Dataviz/utils/sanitizeDimensionsForSources.js';
import { DataSourceKindSection } from '../data/DataSourceKindSection.js';
import { ManualDataEditor } from '../data/ManualDataEditor.js';
import { DataSourcesList } from '../data/sources/DataSourcesList.js';
import { JoinModeSection } from '../data/sources/JoinModeSection.js';
import { FiltersSection } from '../data/filters/FiltersSection.js';
import { DimensionSection } from '../data/DimensionSection.js';
import { SupportedChartTypesCallout } from '../data/SupportedChartTypesCallout.js';

type DataTabProps = {
  definition: DatavizDefinition;
  onPatch: (patch: Partial<DatavizDefinition>) => void;
  onPatchQuery: (patch: Partial<DatavizDefinition['query']>) => void;
  onPatchChart?: (patch: Partial<DatavizDefinition['chart']>) => void;
};

const DataTab = ({ definition, onPatch, onPatchQuery, onPatchChart }: DataTabProps) => {
  const templates = useAtomValue(templatesAtom);
  const { query, chart } = definition;
  const dataSource = definition.dataSource ?? 'query';
  const isManual = isManualDataSource(dataSource);
  const primaryDimension = query.dimensions[0];
  const secondaryDimension = query.dimensions[1];
  const measure = query.measures[0] || { aggregation: 'count' as const, countMode: 'all' as const };

  const handleDataSourceChange = (nextSource: DatavizDataSourceKind) => {
    if (nextSource === 'manual') {
      onPatch({
        dataSource: 'manual',
        manualData: definition.manualData ?? MANUAL_DATA_EXAMPLE,
      });
      if (onPatchChart) {
        const chartPatch = resolveChartPatchForQuery(
          chart,
          query.dimensions,
          query.measures,
          'manual'
        );
        if (chartPatch) {
          onPatchChart(chartPatch);
        }
      }
      return;
    }
    onPatch({ dataSource: 'query' });
    if (onPatchChart) {
      const chartPatch = resolveChartPatchForQuery(
        chart,
        query.dimensions,
        query.measures,
        'query'
      );
      if (chartPatch) {
        onPatchChart(chartPatch);
      }
    }
  };

  const syncChartWithQuery = useCallback(
    (dimensions: DimensionSpec[], measures: MeasureSpec[]) => {
      if (!onPatchChart) return;
      const chartPatch = resolveChartPatchForQuery(chart, dimensions, measures, dataSource);
      if (chartPatch) {
        onPatchChart(chartPatch);
      }
    },
    [chart, onPatchChart]
  );

  const setDimensions = useCallback(
    (primary?: DimensionSpec, secondary?: DimensionSpec) => {
      const dimensions = [primary, secondary].filter((d): d is DimensionSpec => Boolean(d));
      onPatchQuery({ dimensions });
      syncChartWithQuery(dimensions, query.measures);
    },
    [onPatchQuery, query.measures, syncChartWithQuery]
  );

  const setMeasure = useCallback(
    (nextMeasure: MeasureSpec) => {
      const measures = [nextMeasure];
      onPatchQuery({ measures });
      syncChartWithQuery(query.dimensions, measures);
    },
    [onPatchQuery, query.dimensions, syncChartWithQuery]
  );

  const handleSourcesChange = useCallback(
    (sources: DatavizDefinition['query']['sources']) => {
      const structureChanged =
        sources.length !== query.sources.length ||
        sources.some((source, index) => source.templateId !== query.sources[index]?.templateId);

      const templateNameById = new Map(templates.filter(t => t._id).map(t => [t._id!, t.name]));
      const nextSources = structureChanged
        ? ensureSourceAliases(sources, templateNameById)
        : sources;
      const nextDimensions = sanitizeDimensionsForSources(
        query.dimensions,
        nextSources,
        templates as ClientTemplateSchema[]
      );

      let join: DatavizDefinition['query']['join'];
      if (nextSources.length > 1) {
        join = query.join?.type === 'union' ? { type: 'union' } : { type: 'compare' };
      } else {
        join = undefined;
      }

      onPatchQuery({
        sources: nextSources,
        dimensions: nextDimensions,
        join,
      });
      syncChartWithQuery(nextDimensions, query.measures);
    },
    [
      onPatchQuery,
      query.dimensions,
      query.join?.type,
      query.measures,
      syncChartWithQuery,
      templates,
    ]
  );

  const isMultiSource = query.sources.length > 1;

  useEffect(() => {
    if (isManual) {
      return;
    }
    const sanitized = sanitizeDimensionsForSources(
      query.dimensions,
      query.sources,
      templates as ClientTemplateSchema[]
    );
    const changed =
      sanitized.length !== query.dimensions.length ||
      JSON.stringify(sanitized) !== JSON.stringify(query.dimensions);

    if (changed) {
      onPatchQuery({ dimensions: sanitized });
      syncChartWithQuery(sanitized, query.measures);
    }
  }, [isManual, query.sources, templates]);

  return (
    <div className="flex flex-col gap-6 p-4">
      <DataSourceKindSection value={dataSource} onChange={handleDataSourceChange} />

      {isManual ? (
        <>
          <ManualDataEditor
            manualData={definition.manualData}
            onChange={manualData => onPatch({ manualData })}
            onLoadExample={chartType => {
              onPatchChart?.({
                type: chartType,
                ...(chartType === 'scatter' ? { showLabels: false } : {}),
              });
            }}
          />
          <SupportedChartTypesCallout
            dimensions={query.dimensions}
            measures={query.measures}
            dataSource={dataSource}
          />
        </>
      ) : (
        <>
          <DataSourcesList sources={query.sources} onChange={handleSourcesChange} />
          {query.sources.length > 1 && (
            <JoinModeSection join={query.join} onChange={join => onPatchQuery({ join })} />
          )}
          <FiltersSection
            filters={query.filters || []}
            sources={query.sources}
            onChange={filters => onPatchQuery({ filters })}
          />
          <DimensionSection
            sources={query.sources}
            dimension={primaryDimension}
            measure={measure}
            onMeasureChange={setMeasure}
            onChange={dim => setDimensions(dim, isMultiSource ? undefined : secondaryDimension)}
            title="Primary dimension (X-axis / categories)"
            idPrefix="primary-dimension"
            allowTemplateDimension={!isMultiSource}
          />
          {!isMultiSource && (
            <DimensionSection
              sources={query.sources}
              dimension={secondaryDimension}
              measure={measure}
              onMeasureChange={setMeasure}
              onChange={dim => setDimensions(primaryDimension, dim)}
              title="Second dimension (series / stacks)"
              idPrefix="secondary-dimension"
              excludedProperties={primaryDimension?.property ? [primaryDimension.property] : []}
              allowTemplateDimension={false}
              allowNone
            />
          )}
          {!isMultiSource && isTwoDimensionalQuery(query.dimensions) && (
            <p className="text-xs text-ink-secondary">
              Two categorical dimensions enable stacked bar charts (e.g. country with sex
              breakdown).
            </p>
          )}
          {!isMultiSource &&
            query.dimensions.length >= 2 &&
            query.dimensions[1]?.propertyType === 'numeric' && (
              <p className="text-xs text-ink-secondary">
                Date or numeric × numeric enables scatter and heatmap. Line, area, and bar plot the
                measure over the primary dimension (e.g. max engine size per registration date).
              </p>
            )}
          <SupportedChartTypesCallout
            dimensions={query.dimensions}
            measures={query.measures}
            dataSource={dataSource}
          />
          <p className="text-xs text-ink-muted">Preview updates automatically (300ms debounce)</p>
        </>
      )}
    </div>
  );
};

export { DataTab };
