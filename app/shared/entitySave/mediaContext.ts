import type { MediaPropertyContext, TemplateProperty } from './types.js';

const mediaContextFromProperties = (
  properties: ReadonlyArray<TemplateProperty> | undefined
): MediaPropertyContext => {
  const mediaProperties =
    properties?.filter(
      (property): property is TemplateProperty & { type: 'image' | 'media' } =>
        property.type === 'image' || property.type === 'media'
    ) ?? [];

  return {
    names: new Set(mediaProperties.map(property => property.name)),
    types: new Map(mediaProperties.map(property => [property.name, property.type])),
  };
};

const mediaContextFromTemplate = (
  template?: { properties?: ReadonlyArray<TemplateProperty> } | null
): MediaPropertyContext => mediaContextFromProperties(template?.properties);

export { mediaContextFromProperties, mediaContextFromTemplate };
