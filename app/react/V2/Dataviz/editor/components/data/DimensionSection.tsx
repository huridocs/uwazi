import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Select } from '#V2/Components/Forms/Select.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { Pill } from '#V2/Components/UI/Pill.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { buildDimensionFromProperty } from '#V2/Dataviz/utils/buildDimensionFromProperty.js';
import { getSharedDimensionProperties } from '#V2/Dataviz/utils/getSharedDimensionProperties.js';
import {
  TEMPLATE_DIMENSION_PROPERTY,
  type DatavizSource,
  type DimensionSpec,
} from '#V2/Dataviz/types/definition.js';

type DimensionSectionProps = {
  sources: DatavizSource[];
  dimension?: DimensionSpec;
  onChange: (dimension: DimensionSpec | undefined) => void;
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
  title = 'Dimension (X-axis / categories)',
  idPrefix = 'dimension',
  excludedProperties = [],
  allowTemplateDimension = true,
  allowNone = false,
}: DimensionSectionProps) => {
  const templates = useAtomValue(templatesAtom);
  const multiSource = sources.length > 1;
  const activeSource =
    sources.find(s => s.alias === dimension?.sourceAlias) || sources.find(s => s.templateId) || sources[0];
  const template = templates.find(t => t._id === activeSource?.templateId);

  const availableProperties = useMemo(
    () => getSharedDimensionProperties(sources, templates),
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
        sort: 'count_desc',
        maxBuckets: 10,
      });
      return;
    }
    const prop = availableProperties.find(p => p.name === propertyName);
    if (!prop) return;
    const next = buildDimensionFromProperty(prop, multiSource ? undefined : dimension?.sourceAlias);
    if (next) {
      onChange(next);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {multiSource && (
        <p className="text-xs text-ink-secondary">
          Only properties with the same name and configuration in every data source are available.
        </p>
      )}
      <Select
        id={`${idPrefix}-property`}
        label="Property"
        value={dimension?.property || ''}
        options={propertyOptions}
        onChange={e => handlePropertyChange(e.target.value)}
      />
      {selectedProperty && (
        <Pill color="blue">{selectedProperty.type}</Pill>
      )}
      {dimension && dimension.property !== TEMPLATE_DIMENSION_PROPERTY && (
        <>
          <Select
            id={`${idPrefix}-sort`}
            label="Sort by"
            value={dimension.sort || 'count_desc'}
            options={[
              { value: 'count_desc', label: 'Count (desc)' },
              { value: 'label_asc', label: 'Label (asc)' },
              { value: 'key_asc', label: 'Key (asc)' },
            ]}
            onChange={e =>
              onChange({ ...dimension, sort: e.target.value as DimensionSpec['sort'] })
            }
          />
          <InputField
            id={`${idPrefix}-max-buckets`}
            label="Max buckets"
            type="number"
            value={String(dimension.maxBuckets ?? 10)}
            onChange={e =>
              onChange({ ...dimension, maxBuckets: Number(e.target.value) || 10 })
            }
          />
        </>
      )}
    </section>
  );
};

export { DimensionSection };
