import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { formatMetadataForForm } from '../EntityEditor/functions/formatMetadataForForm.js';
import type { CopyFromMatchingProperty } from './copyFromMatchingProperties.js';

type ApplyCopyFromMetadataInput = {
  currentMetadata: Record<string, MetadataValue[]>;
  sourceMetadata: Entity['metadata'];
  matchingProperties: CopyFromMatchingProperty[];
};

const applyCopyFromMetadata = ({
  currentMetadata,
  sourceMetadata,
  matchingProperties,
}: ApplyCopyFromMetadataInput): Record<string, MetadataValue[]> => ({
  ...currentMetadata,
  ...formatMetadataForForm(
    matchingProperties.map(property => ({
      _id: property.name,
      name: property.name,
      type: property.type,
      label: property.label,
    })),
    sourceMetadata
  ),
});

export { applyCopyFromMetadata };
export type { ApplyCopyFromMetadataInput };
