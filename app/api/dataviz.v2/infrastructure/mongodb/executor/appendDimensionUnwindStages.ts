import type { DimensionSpec } from '#shared/types/datavizSchema.js';
import { dimensionNeedsUnwind } from '#shared/dataviz/relationshipDimension.js';
import { metadataPath } from './relationshipDimensionFields.js';

const appendDimensionUnwindStages = (pipeline: object[], dim: DimensionSpec) => {
  if (!dimensionNeedsUnwind(dim)) {
    return;
  }

  pipeline.push({
    $unwind: { path: `$${metadataPath(dim.property)}`, preserveNullAndEmptyArrays: true },
  });

  if (dim.relationshipMode === 'inherited' && dim.propertyType === 'multiselect') {
    pipeline.push({
      $unwind: {
        path: `$${metadataPath(dim.property)}.inheritedValue`,
        preserveNullAndEmptyArrays: true,
      },
    });
  }
};

export { appendDimensionUnwindStages };
