import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Select } from '#V2/Components/Forms/Select.js';
import { Checkbox } from '#V2/Components/Forms/Checkbox.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { Pill } from '#V2/Components/UI/Pill.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { filterDatavizProperties } from '#V2/Dataviz/utils/filterDatavizProperties.js';
import {
  TEMPLATE_DIMENSION_PROPERTY,
  type DatavizSource,
  type DimensionSpec,
  type PropertyTypeForDataviz,
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

  const propertyOptions = useMemo(() => {
    const base = filterDatavizProperties(template?.properties || []).filter(
      p => !excludedProperties.includes(p.name)
    );
    const options = [
      { value: '', label: allowNone ? 'None' : 'Select property…' },
      ...(allowTemplateDimension && multiSource
        ? [{ value: TEMPLATE_DIMENSION_PROPERTY, label: 'Entity type (template)' }]
        : []),
      ...base.map(p => ({ value: p.name, label: p.label })),
    ];
    return options;
  }, [template, multiSource, excludedProperties, allowTemplateDimension, allowNone]);

  const selectedProperty =
    dimension?.property === TEMPLATE_DIMENSION_PROPERTY
      ? { type: 'template', label: 'Entity type' }
      : template?.properties?.find(p => p.name === dimension?.property);

  const handlePropertyChange = (propertyName: string) => {
    if (!propertyName) {
      onChange(undefined);
      return;
    }
    if (propertyName === TEMPLATE_DIMENSION_PROPERTY) {
      onChange({
        sourceAlias: dimension?.sourceAlias,
        property: TEMPLATE_DIMENSION_PROPERTY,
        propertyType: 'select',
        bucketStrategy: 'terms',
        sort: 'count_desc',
        includeMissing: false,
        maxBuckets: 10,
      });
      return;
    }
    const prop = template?.properties?.find(p => p.name === propertyName);
    if (!prop) return;
    onChange({
      sourceAlias: dimension?.sourceAlias,
      property: prop.name,
      propertyType: prop.type as PropertyTypeForDataviz,
      bucketStrategy: prop.type === 'date' ? 'date_histogram' : 'terms',
      sort: 'count_desc',
      includeMissing: false,
      maxBuckets: 10,
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {multiSource && dimension && (
        <Select
          id={`${idPrefix}-source`}
          label="Source"
          value={dimension.sourceAlias || sources[0]?.alias || ''}
          options={sources.map(s => ({
            value: s.alias || s.templateId,
            label: s.alias || templates.find(t => t._id === s.templateId)?.name || s.templateId,
          }))}
          onChange={e => onChange({ ...dimension, sourceAlias: e.target.value })}
        />
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
            id={`${idPrefix}-bucket-strategy`}
            label="Bucket strategy"
            value={dimension.bucketStrategy || 'terms'}
            options={[
              { value: 'terms', label: 'Terms (top values)' },
              { value: 'date_histogram', label: 'Date histogram' },
              { value: 'range', label: 'Range' },
            ]}
            onChange={e =>
              onChange({
                ...dimension,
                bucketStrategy: e.target.value as DimensionSpec['bucketStrategy'],
              })
            }
          />
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
          <Checkbox
            name={`${idPrefix}-include-missing`}
            label="Include missing values"
            checked={dimension.includeMissing ?? false}
            onChange={e =>
              onChange({
                ...dimension,
                includeMissing: (e.target as HTMLInputElement).checked,
              })
            }
          />
        </>
      )}
    </section>
  );
};

export { DimensionSection };
