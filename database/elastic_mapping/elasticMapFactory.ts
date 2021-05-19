import { TemplateSchema } from 'shared/types/templateType';
import { propertyMappings } from './mappings';
import templatesModel from 'api/templates/templatesModel';
import propertiesHelper from 'shared/comonProperties';

const getInheritedProps = async templates => {
  const properties = propertiesHelper.allUniqueProperties(templates).filter(p => p.inherit);
  return (
    await templatesModel.db.aggregate([
      // Get just the docs that contain a shapes element where color is 'red'
      {
        $match: {
          'properties._id': { $in: properties.map(p => p.inheritProperty) },
        },
      },
      {
        $project: {
          properties: {
            $filter: {
              input: '$properties',
              as: 'property',
              cond: {
                $or: properties.map(p => ({ $eq: ['$$property._id', p.inheritProperty] })),
              },
            },
          },
          _id: 0,
        },
      },
      { $unwind: '$properties' },
      { $replaceRoot: { newRoot: '$properties' } },
    ])
  ).reduce((indexed, prop) => {
    indexed[prop._id.toString()] = prop;
    return indexed;
  }, {});
};

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

          // if (property.inherit) {
          //   const inheritMapping = propertyMappings[
          //     inheritedProps[property.inheritProperty.toString()].type
          //   ]();
          //   map.properties.metadata.properties[property.name].properties.inheritedValue = {
          //     properties: inheritMapping,
          //   };
          // }

          return map;
        }, baseMapping),
      baseMappingObject
    );
  },
};
