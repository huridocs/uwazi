import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { RelationshipPropertyMappingFactory } from 'api/templates.v2/database/mappings/RelationshipPropertyMappingFactory';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { TemplateSchema } from 'shared/types/templateType';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { propertyMappings } from './mappings';

const createNewRelationshipMappingFactory = async () => {
  const db = getConnection();
  const transactionManager = DefaultTransactionManager();
  const settingsDataSource = new MongoSettingsDataSource(db, transactionManager);

  if (!(await settingsDataSource.readNewRelationshipsAllowed())) {
    return null;
  }

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

    const newRelationshipMappingFactory = await createNewRelationshipMappingFactory();

    await Promise.all(
      templates.map(async template =>
        Promise.all(
          (template.properties || []).map(async property => {
            if (
              !property.name ||
              !property.type ||
              property.type === 'preview' ||
              (!newRelationshipMappingFactory && property.type === 'newRelationship')
            ) {
              return;
            }

            baseMappingObject.properties.metadata.properties[property.name] = {
              properties:
                newRelationshipMappingFactory && property.type === 'newRelationship'
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
