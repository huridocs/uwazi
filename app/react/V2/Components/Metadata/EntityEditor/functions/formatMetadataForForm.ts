import { PropertySchema } from '#shared/types/commonTypes.js';
import { Entity } from '#V2/api/entities/types.js';
import { resolvePropertyMetadataValues } from '#V2/formatters/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';

type FormMetadataProperty = {
  _id: string;
  type: PropertySchema['type'];
  name: string;
  label: string;
  required?: boolean;
  content?: string;
  style?: string;
  inherited?: boolean;
  inheritedType?: MetadataValue['inheritedType'];
};

const formatMetadataForForm = (
  templateProperties: FormMetadataProperty[],
  entityMetadata?: Entity['metadata']
): Record<string, MetadataValue[]> =>
  templateProperties.reduce<Record<string, MetadataValue[]>>((acc, property) => {
    acc[property.name] = resolvePropertyMetadataValues(property, entityMetadata);
    return acc;
  }, {});

export { formatMetadataForForm };
export type { FormMetadataProperty };
