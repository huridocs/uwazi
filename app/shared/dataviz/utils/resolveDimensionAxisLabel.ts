import type { DatavizSource, DimensionSpec } from '#shared/types/datavizSchema.js';

type TemplatePropertyMeta = { name: string; label: string };

const humanizePropertyName = (name: string): string =>
  name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

export const resolveDimensionAxisLabel = (
  dimension: DimensionSpec | undefined,
  sources: DatavizSource[] | undefined,
  templatePropertiesById: Record<string, TemplatePropertyMeta[]> | undefined
): string | undefined => {
  if (!dimension) {
    return undefined;
  }

  const source = sources?.[0];
  const properties = source ? templatePropertiesById?.[source.templateId] : undefined;
  const match = properties?.find(prop => prop.name === dimension.property);
  return match?.label ?? humanizePropertyName(dimension.property);
};

export const inferYearAxisName = (values: number[]): string | undefined => {
  if (!values.length) {
    return undefined;
  }

  if (values.every(value => Number.isInteger(value) && value >= 1900 && value <= 2100)) {
    return 'Year';
  }

  return undefined;
};
