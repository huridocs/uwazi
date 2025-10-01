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
  mapping: async (templates: TemplateSchema[]) => {
    const baseMappingObject = {
      properties: {
        metadata: {
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

            // Skip unknown property types to avoid calling undefined mappings
            if (property.type !== 'newRelationship' && !propertyMappings[property.type]) {
              return;
            }

            baseMappingObject.properties.metadata.properties[property.name] = {
              properties:
                newRelationshipMappingFactory && property.type === 'newRelationship'
                  ? await newRelationshipMappingFactory.create(property)
                  : propertyMappings[property.type](),
            };
            if (property.inherit?.type && property.inherit.type !== 'preview') {
              if (propertyMappings[property.inherit.type]) {
                baseMappingObject.properties.metadata.properties[
                  property.name
                ].properties.inheritedValue = {
                  properties: propertyMappings[property.inherit.type](),
                };
              }
            }
          })
        )
      )
    );

    return baseMappingObject;
  },
};