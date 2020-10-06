import { TemplateSchema } from 'shared/types/templateType';
import { propertyMappings } from './mappings';

export default {
  mapping: (templates: TemplateSchema[]) => {
    const baseMappingObject = {
      properties: {
        metadata: {
          properties: {},
        },
      },
    };

    return templates.reduce((baseMapping: any, template: TemplateSchema) => {
      return template.properties?.reduce((map: any, property) => {
        if (!property.name || !property.type || property.type === 'preview') {
          return map;
        }

        map.properties.metadata.properties[property.name] = {
          properties: propertyMappings[property.type](),
        };

        return map;
      }, baseMapping);
    }, baseMappingObject);
  },
};
