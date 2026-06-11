import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Select } from '#V2/Components/Forms/Select.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { getFilterableProperties } from '#V2/Dataviz/utils/getFilterableProperties.js';
import type { DatavizFilter, DatavizSource } from '#V2/Dataviz/types/definition.js';
import { getOperatorsForPropertyType } from '#V2/Dataviz/utils/filterOperators.js';

type FilterPropertySelectProps = {
  filter: DatavizFilter;
  sources: DatavizSource[];
  onChange: (patch: Partial<DatavizFilter>) => void;
};

const FilterPropertySelect = ({ filter, sources, onChange }: FilterPropertySelectProps) => {
  const templates = useAtomValue(templatesAtom);
  const options = useMemo(() => {
    const props = getFilterableProperties(templates, sources);
    return [
      { value: '', label: 'Select property…' },
      ...props.map(p => ({
        value: `${p.sourceAlias || ''}::${p.propertyName}`,
        label: sources.length > 1 ? `${p.templateName} · ${p.propertyLabel}` : p.propertyLabel,
      })),
    ];
  }, [templates, sources]);

  const handleChange = (composite: string) => {
    if (!composite) {
      onChange({ property: '', propertyType: 'select', operator: 'eq' });
      return;
    }
    const [sourceAlias, propertyName] = composite.split('::');
    const props = getFilterableProperties(templates, sources);
    const match = props.find(
      p => p.propertyName === propertyName && (p.sourceAlias || '') === (sourceAlias || '')
    );
    if (!match) return;
    const propertyType = match.propertyType as DatavizFilter['propertyType'];
    const operator = getOperatorsForPropertyType(propertyType)[0];
    onChange({
      sourceAlias: match.sourceAlias,
      property: match.propertyName,
      propertyType,
      operator,
      value: undefined,
      values: undefined,
      from: undefined,
      to: undefined,
    });
  };

  const currentValue = filter.property
    ? `${filter.sourceAlias || ''}::${filter.property}`
    : '';

  return (
    <Select
      id={`filter-property-${filter.id}`}
      label="Property"
      value={currentValue}
      options={options}
      onChange={e => handleChange(e.target.value)}
    />
  );
};

export { FilterPropertySelect };
