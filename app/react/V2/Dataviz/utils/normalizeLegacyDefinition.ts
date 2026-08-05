import type { DatavizDefinition, DimensionSpec } from '#shared/types/datavizSchema.js';

type LegacyDimensionSpec = DimensionSpec & { includeMissing?: boolean };

const stripLegacyDimensionFields = (dimension: LegacyDimensionSpec): DimensionSpec => {
  const { includeMissing: _includeMissing, ...rest } = dimension;
  return rest;
};

const normalizeAppearance = (
  appearance: DatavizDefinition['appearance']
): DatavizDefinition['appearance'] => ({
  ...appearance,
  colorMode: appearance.colorMode === 'from_data' ? 'theme' : appearance.colorMode,
});

const normalizeLegacyDefinition = (definition: DatavizDefinition): DatavizDefinition => {
  const legacyDimensions = definition.query.dimensions as LegacyDimensionSpec[];
  const hadIncludeMissing = legacyDimensions.some(dimension => dimension.includeMissing);
  const appearance = normalizeAppearance(definition.appearance);

  if (!hadIncludeMissing && definition.chart.showMissingValues !== undefined) {
    return {
      ...definition,
      appearance,
      query: {
        ...definition.query,
        dimensions: legacyDimensions.map(stripLegacyDimensionFields),
      },
    };
  }

  return {
    ...definition,
    appearance,
    query: {
      ...definition.query,
      dimensions: legacyDimensions.map(stripLegacyDimensionFields),
    },
    chart: {
      ...definition.chart,
      showMissingValues: definition.chart.showMissingValues ?? hadIncludeMissing ?? false,
    },
  };
};

export { normalizeLegacyDefinition };
