import type { DatavizFilter } from '#V2/Dataviz/types/definition.js';

const createFilterId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `filter_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const createEmptyFilter = (): DatavizFilter => ({
  id: createFilterId(),
  property: '',
  propertyType: 'select',
  operator: 'eq',
});
