import { TemplateSchema } from 'shared/types/templateType';
import { propertyMappings } from './mappings';

export default {
  mapping: (templates: TemplateSchema[]) => {
    const baseMappingObject = {
      properties: {
        metadata: {
          properties: {},
        },
        suggestedMetadata: {
          properties: {},
        },
      },
    };

    // const inheritedProps = await getInheritedProps(templates);

    return templates.reduce(
      (baseMapping: any, template: TemplateSchema) =>
        template.properties?.reduce((_map: any, property) => {
          const map = { ..._map };
          if (!property.name || !property.type || property.type === 'preview') {
            return map;
          }

          const fieldMapping = propertyMappings[property.type]();

          map.properties.metadata.properties[property.name] = { properties: fieldMapping };
          map.properties.suggestedMetadata.properties[property.name] = { properties: fieldMapping };

          if (property.inherit?.type && property.inherit.type !== 'preview') {
            const inheritMapping = propertyMappings[property.inherit.type]();
            map.properties.metadata.properties[property.name].properties.inheritedValue = {
              properties: inheritMapping,
            };
          }

          return map;
        }, baseMapping),
      baseMappingObject
    );
  },
};
