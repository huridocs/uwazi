import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { RelationshipPropertyMappingFactory } from 'api/templates.v2/database/mappings/RelationshipPropertyMappingFactory';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { TemplateSchema } from 'shared/types/templateType';
import { propertyMappings } from './mappings';

const createNewRelationshipMappingFactory = () => {
  const db = getConnection();
  const client = getClient();
  const transactionManager = new MongoTransactionManager(client);
  const templateDataSource = new MongoTemplatesDataSource(db, transactionManager);

  return new RelationshipPropertyMappingFactory(templateDataSource, propertyMappings);
};

export default {
  mapping: async (templates: TemplateSchema[], topicClassification: boolean) => {
    const baseMappingObject = {
      properties: {
        metadata: {
          properties: {} as any,
        },
        suggestedMetadata: {
          properties: {} as any,
        },
      },
    };

    const newRelationshipMappingFactory = createNewRelationshipMappingFactory();

    await Promise.all(
      templates.map(async template =>
        Promise.all(
          (template.properties || []).map(async property => {
            if (!property.name || !property.type || property.type === 'preview') {
              return;
            }

            baseMappingObject.properties.metadata.properties[property.name] = {
              properties:
                property.type === 'newRelationship'
                  ? await newRelationshipMappingFactory.create(property)
                  : propertyMappings[property.type](),
            };
            if (
              topicClassification &&
              (property.type === 'select' || property.type === 'multiselect')
            ) {
              baseMappingObject.properties.suggestedMetadata.properties[property.name] = {
                properties: {
                  ...propertyMappings[property.type](),
                  suggestion_confidence: {
                    type: 'float',
                  },
                },
              };
            }
            if (property.inherit?.type && property.inherit.type !== 'preview') {
              baseMappingObject.properties.metadata.properties[
                property.name
              ].properties.inheritedValue = {
                properties: propertyMappings[property.inherit.type](),
              };
            }
          })
        )
      )
    );

    return baseMappingObject;
  },
};
