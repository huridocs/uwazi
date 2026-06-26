import type { ClientTemplateSchema } from '#app/istore.js';
import type { DatavizSource, DimensionSpec } from '#V2/Dataviz/types/definition.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';
import { isDimensionPropertyStillValid } from './getSharedDimensionProperties.js';

const stripSourceAlias = (dimension: DimensionSpec): DimensionSpec => {
  const { sourceAlias: _sourceAlias, ...rest } = dimension;
  return rest;
};

export const sanitizeDimensionsForSources = (
  dimensions: DimensionSpec[],
  sources: DatavizSource[],
  templates: ClientTemplateSchema[]
): DimensionSpec[] => {
  if (sources.length <= 1) {
    return dimensions;
  }

  const primary = dimensions[0];
  if (!primary) {
    return [];
  }

  if (
    primary.property === TEMPLATE_DIMENSION_PROPERTY ||
    !isDimensionPropertyStillValid(primary.property, sources, templates)
  ) {
    return [];
  }

  return [stripSourceAlias(primary)];
};
