import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Select } from '#V2/Components/Forms/Select.js';
import type { DatavizFilter, DatavizSource } from '#V2/Dataviz/types/definition.js';
import {
  getOperatorsForPropertyType,
  OPERATOR_LABELS,
  usesMultipleValues,
} from '#V2/Dataviz/utils/filterOperators.js';
import { FilterPropertySelect } from './FilterPropertySelect.js';
import { FilterValueInput } from './FilterValueInput.js';

type FilterRowProps = {
  filter: DatavizFilter;
  sources: DatavizSource[];
  onChange: (filter: DatavizFilter) => void;
  onRemove: () => void;
};

const FilterRow = ({ filter, sources, onChange, onRemove }: FilterRowProps) => {
  const operators = filter.property
    ? getOperatorsForPropertyType(filter.propertyType)
    : (['eq'] as const);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-secondary">Filter</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-ink-muted hover:text-ink"
          aria-label="Remove filter"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <FilterPropertySelect
        filter={filter}
        sources={sources}
        onChange={patch => onChange({ ...filter, ...patch })}
      />
      {filter.property && (
        <>
          <Select
            id={`filter-operator-${filter.id}`}
            label="Operator"
            value={filter.operator}
            options={operators.map(op => ({ value: op, label: OPERATOR_LABELS[op] }))}
            onChange={e => {
              const operator = e.target.value as DatavizFilter['operator'];
              const resetValues = usesMultipleValues(operator)
                ? { value: undefined, from: undefined, to: undefined }
                : { values: undefined, from: undefined, to: undefined };

              if (operator === 'between') {
                onChange({
                  ...filter,
                  operator,
                  value: undefined,
                  values: undefined,
                });
                return;
              }

              onChange({
                ...filter,
                operator,
                ...resetValues,
              });
            }}
          />
          <FilterValueInput
            filter={filter}
            sources={sources}
            onChange={patch => onChange({ ...filter, ...patch })}
          />
        </>
      )}
    </div>
  );
};

export { FilterRow };
