import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { Select } from '#V2/Components/Forms/Select.js';
import { MultiSelect } from '#V2/Components/Forms/MultiSelect.js';
import { templatesAtom, thesauriAtom } from '#V2/atoms/index.js';
import type { DatavizFilter, DatavizSource } from '#V2/Dataviz/types/definition.js';
import { usesMultipleValues } from '#V2/Dataviz/utils/filterOperators.js';
import { parseLocalizedDate, secondsToISODate } from '#V2/shared/dateHelpers.js';

type FilterValueInputProps = {
  filter: DatavizFilter;
  sources: DatavizSource[];
  onChange: (patch: Partial<DatavizFilter>) => void;
};

const FilterValueInput = ({ filter, sources, onChange }: FilterValueInputProps) => {
  const templates = useAtomValue(templatesAtom);
  const thesauri = useAtomValue(thesauriAtom);

  const isDateLikePropertyType = (
    propertyType: DatavizFilter['propertyType']
  ): propertyType is
    | 'date'
    | 'daterange'
    | 'multidate'
    | 'multidaterange' =>
    propertyType === 'date' ||
    propertyType === 'daterange' ||
    propertyType === 'multidate' ||
    propertyType === 'multidaterange';

  const normalizeFilterValue = (value: string | number | undefined) => {
    if (isDateLikePropertyType(filter.propertyType)) {
      return typeof value === 'number'
        ? secondsToISODate(value) ?? ''
        : (value ?? '');
    }
    return value ?? '';
  };

  const parseDateOrStringValue = (value: string) =>
    isDateLikePropertyType(filter.propertyType)
      ? (parseLocalizedDate(value) ?? undefined)
      : value;

  const thesaurusOptions = useMemo(() => {
    const source = sources.find(s => s.alias === filter.sourceAlias) || sources[0];
    const template = templates.find(t => t._id === source?.templateId);
    const prop = template?.properties?.find(p => p.name === filter.property);
    if (!prop?.content) return [];
    const thesaurus = thesauri.find(th => th._id === prop.content);
    return (thesaurus?.values || [])
      .filter((v): v is typeof v & { id: string } => Boolean(v.id))
      .map(v => ({ value: v.id, label: v.label }));
  }, [filter.property, filter.sourceAlias, sources, templates, thesauri]);

  if (filter.operator === 'between') {
    return (
      <div className="flex gap-2">
        <InputField
          id={`filter-from-${filter.id}`}
          label="From"
          type={filter.propertyType === 'date' ? 'date' : 'number'}
          value={normalizeFilterValue(filter.from)}
          onChange={e => onChange({ from: parseDateOrStringValue(e.target.value) })}
        />
        <InputField
          id={`filter-to-${filter.id}`}
          label="To"
          type={filter.propertyType === 'date' ? 'date' : 'number'}
          value={normalizeFilterValue(filter.to)}
          onChange={e => onChange({ to: parseDateOrStringValue(e.target.value) })}
        />
      </div>
    );
  }

  if (
    usesMultipleValues(filter.operator) &&
    (filter.propertyType === 'select' || filter.propertyType === 'multiselect')
  ) {
    return (
      <MultiSelect
        label="Values"
        value={filter.values ?? []}
        options={thesaurusOptions}
        onChange={values => onChange({ values })}
        canBeEmpty
        placeholder="Select values…"
      />
    );
  }

  if (filter.operator === 'gte' || filter.operator === 'lte') {
    let inputType: 'date' | 'number' | 'text' = 'text';
    if (filter.propertyType === 'date') {
      inputType = 'date';
    } else if (filter.propertyType === 'numeric') {
      inputType = 'number';
    }

    return (
      <InputField
        id={`filter-bound-${filter.id}`}
        label={filter.operator === 'gte' ? 'From' : 'Up to'}
        type={inputType}
        value={normalizeFilterValue(
          filter.operator === 'gte' ? filter.from : filter.to
        )}
        onChange={e =>
          onChange(
            filter.operator === 'gte' ? { from: parseDateOrStringValue(e.target.value) } : { to: parseDateOrStringValue(e.target.value) }
          )
        }
      />
    );
  }

  if (filter.propertyType === 'select' && (filter.operator === 'eq' || filter.operator === 'ne')) {
    return (
      <Select
        id={`filter-value-${filter.id}`}
        label="Value"
        value={String(filter.value || '')}
        options={[{ value: '', label: 'Select…' }, ...thesaurusOptions]}
        onChange={e => onChange({ value: e.target.value })}
      />
    );
  }

  return (
    <InputField
      id={`filter-value-${filter.id}`}
      label="Value"
      type={filter.propertyType === 'numeric' ? 'number' : 'text'}
      value={String(filter.value ?? '')}
      onChange={e => onChange({ value: e.target.value })}
    />
  );
};

export { FilterValueInput };
