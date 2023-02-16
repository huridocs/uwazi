import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { RelationshipPropertyMappingFactory } from 'api/templates.v2/database/mappings/RelationshipPropertyMappingFactory';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { TemplateSchema } from 'shared/types/templateType';
import { propertyMappings } from './mappings';

const initV2Mapping = async () => {
  const db = getConnection();
  const client = getClient();
  const transactionManager = new MongoTransactionManager(client);
  const templateDataSource = new MongoTemplatesDataSource(db, transactionManager);
  const mappingFactory = new RelationshipPropertyMappingFactory(
    templateDataSource,
    propertyMappings
  );
  await mappingFactory.init();
  return mappingFactory;
};

export default {
  mapping: async (templates: TemplateSchema[], topicClassification: boolean) => {
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

    const v2MappingFactory = await initV2Mapping();

    return templates.reduce(
      (baseMapping: any, template: TemplateSchema) =>
        // eslint-disable-next-line max-statements
        template.properties?.reduce((_map: any, property) => {
          const map = { ..._map };
          if (!property.name || !property.type || property.type === 'preview') {
            return map;
          }

          map.properties.metadata.properties[property.name] = {
            properties:
              property.type === 'newRelationship'
                ? v2MappingFactory.create(property.denormalizedProperty)
                : propertyMappings[property.type](),
          };
          if (
            topicClassification &&
            (property.type === 'select' || property.type === 'multiselect')
          ) {
            map.properties.suggestedMetadata.properties[property.name] = {
              properties: {
                ...propertyMappings[property.type](),
                suggestion_confidence: {
                  type: 'float',
                },
              },
            };
          }
          if (property.inherit?.type && property.inherit.type !== 'preview') {
            map.properties.metadata.properties[property.name].properties.inheritedValue = {
              properties: propertyMappings[property.inherit.type](),
            };
          }
          return map;
        }, baseMapping),
      baseMappingObject
    );
  },
};
