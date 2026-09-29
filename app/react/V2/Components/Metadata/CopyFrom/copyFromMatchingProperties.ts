import type { PropertyTypeSchema } from '#shared/types/commonTypes.js';
import comonProperties from '#shared/commonProperties.js';

const COPY_FROM_EXCLUDED_TYPES = ['generatedid', 'media', 'image'];

type CopyFromTemplateProperty = {
  name: string;
  type: PropertyTypeSchema;
  label?: string;
  content?: string;
  inherit?: { property?: string; type?: string };
};

type CopyFromTemplate = {
  _id: string;
  properties?: CopyFromTemplateProperty[];
};

type CopyFromMatchingProperty = {
  name: string;
  type: PropertyTypeSchema;
  label: string;
};

const copyFromMatchingProperties = (
  templates: CopyFromTemplate[],
  currentTemplateId?: string,
  sourceTemplateId?: string
): CopyFromMatchingProperty[] => {
  if (!currentTemplateId || !sourceTemplateId) {
    return [];
  }

  const currentTemplate = templates.some(template => template._id === currentTemplateId);
  const sourceTemplate = templates.some(template => template._id === sourceTemplateId);
  if (!currentTemplate || !sourceTemplate) {
    return [];
  }

  return comonProperties
    .comonProperties(templates, [currentTemplateId, sourceTemplateId], COPY_FROM_EXCLUDED_TYPES)
    .map((property: CopyFromTemplateProperty) => ({
      name: property.name,
      type: property.type,
      label: property.label || property.name,
    }));
};

export { COPY_FROM_EXCLUDED_TYPES, copyFromMatchingProperties };
export type { CopyFromMatchingProperty, CopyFromTemplate, CopyFromTemplateProperty };
