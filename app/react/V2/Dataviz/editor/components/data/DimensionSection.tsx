import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { useAtomValue } from 'jotai';
import type { ClientTemplateSchema } from '#app/istore.js';
import { Select } from '#V2/Components/Forms/Select.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { Pill } from '#V2/Components/UI/Pill.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { buildDimensionFromProperty } from '#V2/Dataviz/utils/buildDimensionFromProperty.js';
import { getSharedDimensionProperties } from '#V2/Dataviz/utils/getSharedDimensionProperties.js';
import {
  isDateLikePropertyType,
  isNumericPropertyType,
  getDefaultDimensionSort,
} from '#shared/dataviz/dimensionPropertyTypes.js';
import {
  TEMPLATE_DIMENSION_PROPERTY,
  type DatavizSource,
  type DimensionSpec,
  type MeasureSpec,
} from '#V2/Dataviz/types/definition.js';

const NUMERIC_AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Avg' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'count', label: 'Count' },
] as const;

const DATE_INTERVAL_OPTIONS = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'computed_years', label: 'Computed years' },
] as const;

type DateIntervalOption = (typeof DATE_INTERVAL_OPTIONS)[number]['value'];

const toDateIntervalValue = (interval?: DimensionSpec['dateInterval']): DateIntervalOption => {
  if (interval === 'month' || interval === 'week' || interval === 'computed_years') {
    return interval;
  }
  return 'year';
};

const buildMeasureForNumericDimension = (
  dimension: DimensionSpec,
  aggregation: MeasureSpec['aggregation']
): MeasureSpec => {
  if (aggregation === 'count') {
    return { aggregation: 'count', countMode: 'all' };
  }
  return {
    aggregation,
    property: dimension.property,
    propertyType: 'numeric',
    countMode: 'all',
  };
};

const isMeasureOwnedByDimension = (dimension: DimensionSpec, measure?: MeasureSpec): boolean => {
  if (!measure) {
    return false;
  }
  if (measure.aggregation === 'count') {
    return true;
  }
  return measure.property === dimension.property;
};

type DimensionSectionProps = {
  sources: DatavizSource[];
  dimension?: DimensionSpec;
  onChange: (dimension: DimensionSpec | undefined) => void;
  measure?: MeasureSpec;
  onMeasureChange?: (measure: MeasureSpec) => void;
  title?: string;
  idPrefix?: string;
  excludedProperties?: string[];
  allowTemplateDimension?: boolean;
  allowNone?: boolean;
};

const DimensionSection = ({
  sources,
  dimension,
  onChange,
  measure,
  onMeasureChange,
  title = 'Dimension (X-axis / categories)',
  idPrefix = 'dimension',
  excludedProperties = [],
  allowTemplateDimension = true,
  allowNone = false,
}: DimensionSectionProps) => {
  const templates = useAtomValue(templatesAtom);
  const multiSource = sources.length > 1;
  const activeSource =
    sources.find(s => s.alias === dimension?.sourceAlias) ||
    sources.find(s => s.templateId) ||
    sources[0];
  const template = templates.find(t => t._id === activeSource?.templateId);

  const availableProperties = useMemo(
    () => getSharedDimensionProperties(sources, templates as ClientTemplateSchema[]),
    [sources, templates]
  );

  const propertyOptions = useMemo(() => {
    const base = availableProperties.filter(p => !excludedProperties.includes(p.name));
    const options = [
      { value: '', label: allowNone ? 'None' : 'Select property…' },
      ...(allowTemplateDimension && multiSource
        ? [{ value: TEMPLATE_DIMENSION_PROPERTY, label: 'Entity type (template)' }]
        : []),
      ...base.map(p => ({ value: p.name, label: p.label })),
    ];
    return options;
  }, [availableProperties, multiSource, excludedProperties, allowTemplateDimension, allowNone]);

  const selectedProperty =
    dimension?.property === TEMPLATE_DIMENSION_PROPERTY
      ? { type: 'template', label: 'Entity type' }
      : availableProperties.find(p => p.name === dimension?.property) ||
        template?.properties?.find(p => p.name === dimension?.property);

  const showNumericAggregation =
    dimension != null &&
    dimension.property !== TEMPLATE_DIMENSION_PROPERTY &&
    isNumericPropertyType(dimension.propertyType) &&
    Boolean(onMeasureChange);

  const showDateInterval =
    dimension != null &&
    dimension.property !== TEMPLATE_DIMENSION_PROPERTY &&
    isDateLikePropertyType(dimension.propertyType);

  const numericAggregationValue =
    showNumericAggregation && isMeasureOwnedByDimension(dimension!, measure)
      ? (measure?.aggregation ?? 'count')
      : 'count';

  const handlePropertyChange = (propertyName: string) => {
    if (!propertyName) {
      onChange(undefined);
      return;
    }
    if (propertyName === TEMPLATE_DIMENSION_PROPERTY) {
      onChange({
        property: TEMPLATE_DIMENSION_PROPERTY,
        propertyType: 'select',
        bucketStrategy: 'terms',
        sort: getDefaultDimensionSort('select'),
        maxBuckets: 10,
      });
      return;
    }
    const prop = availableProperties.find(p => p.name === propertyName);
    if (!prop) return;
    const next = buildDimensionFromProperty(prop, multiSource ? undefined : dimension?.sourceAlias);
    if (next) {
      onChange(next);
      if (onMeasureChange && isNumericPropertyType(next.propertyType)) {
        onMeasureChange(buildMeasureForNumericDimension(next, 'count'));
      }
    }
  };

  const handleNumericAggregationChange = (aggregationId: string) => {
    if (!dimension || !onMeasureChange) {
      return;
    }
    onMeasureChange(
      buildMeasureForNumericDimension(dimension, aggregationId as MeasureSpec['aggregation'])
    );
  };

  const handleDateIntervalChange = (intervalId: string) => {
    if (!dimension) {
      return;
    }
    onChange({
      ...dimension,
      bucketStrategy: 'date_histogram',
      dateInterval: intervalId as DimensionSpec['dateInterval'],
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {multiSource && (
        <p className="text-xs text-ink-secondary">
          <Translate>
            Only properties with the same name and configuration in every data source are available.
          </Translate>
        </p>
      )}
      <Select
        id={`${idPrefix}-property`}
        label="Property"
        value={dimension?.property || ''}
        options={propertyOptions}
        onChange={e => handlePropertyChange(e.target.value)}
      />
      {selectedProperty && <Pill color="blue">{selectedProperty.type}</Pill>}
      {showNumericAggregation && (
        <Select
          id={`${idPrefix}-aggregation`}
          label="Aggregation"
          value={numericAggregationValue}
          options={[...NUMERIC_AGGREGATION_OPTIONS]}
          onChange={e => handleNumericAggregationChange(e.target.value)}
        />
      )}
      {showDateInterval && (
        <Select
          id={`${idPrefix}-date-interval`}
          label="Date interval"
          value={toDateIntervalValue(dimension?.dateInterval)}
          options={[...DATE_INTERVAL_OPTIONS]}
          onChange={e => handleDateIntervalChange(e.target.value)}
        />
      )}
      {dimension && dimension.property !== TEMPLATE_DIMENSION_PROPERTY && (
        <InputField
          id={`${idPrefix}-max-buckets`}
          label="Max buckets"
          type="number"
          value={String(dimension.maxBuckets ?? 10)}
          onChange={e => onChange({ ...dimension, maxBuckets: Number(e.target.value) || 10 })}
        />
      )}
    </section>
  );
};

export { DimensionSection };
