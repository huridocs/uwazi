import type { MultiSelectMetadataProperty, SelectMetadataProperty } from '#V2/formatters/types.js';

type SelectValue =
  | SelectMetadataProperty['values'][number]
  | MultiSelectMetadataProperty['values'][number];

const formatMetadataSelectValue = (value: SelectValue): string => {
  const base = value.label || value.value;
  if (value.parent?.label) {
    return `${value.parent.label}: ${base}`;
  }
  return base;
};

export { formatMetadataSelectValue };
