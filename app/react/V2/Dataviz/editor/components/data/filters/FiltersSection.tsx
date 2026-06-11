import React from 'react';
import { Button } from '#V2/Components/UI/Button.js';
import { createEmptyFilter } from '#V2/Dataviz/utils/createEmptyFilter.js';
import type { DatavizFilter, DatavizSource } from '#V2/Dataviz/types/definition.js';
import { FilterRow } from './FilterRow.js';

type FiltersSectionProps = {
  filters: DatavizFilter[];
  sources: DatavizSource[];
  onChange: (filters: DatavizFilter[]) => void;
};

const FiltersSection = ({ filters, sources, onChange }: FiltersSectionProps) => {
  const updateFilter = (index: number, filter: DatavizFilter) => {
    const next = [...filters];
    next[index] = filter;
    onChange(next);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">Filters</h3>
      <p className="text-xs text-ink-secondary">
        Narrow entities before aggregation. Saved in the definition for the backend executor.
      </p>
      {filters.map((filter, index) => (
        <FilterRow
          key={filter.id}
          filter={filter}
          sources={sources}
          onChange={updated => updateFilter(index, updated)}
          onRemove={() => removeFilter(index)}
        />
      ))}
      <Button
        type="button"
        variant="secondary"
        size="small"
        onClick={() => onChange([...filters, createEmptyFilter()])}
      >
        + Add filter
      </Button>
    </section>
  );
};

export { FiltersSection };
