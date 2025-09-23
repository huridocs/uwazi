import { getConnection } from '../../app/api/common.v2/database/getConnectionForCurrentTenant.js';
import { MongoSettingsDataSource } from '../../app/api/settings.v2/database/MongoSettingsDataSource.js';
import { RelationshipPropertyMappingFactory } from '../../app/api/templates.v2/database/mappings/RelationshipPropertyMappingFactory.js';
import { MongoTemplatesDataSource } from '../../app/api/templates.v2/database/MongoTemplatesDataSource.js';
import { TemplateSchema } from '../../app/shared/types/templateType.js';
import { DefaultTransactionManager } from '../../app/api/common.v2/database/data_source_defaults.js';
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

            baseMappingObject.properties.metadata.properties[property.name] = {
              properties:
                newRelationshipMappingFactory && property.type === 'newRelationship'
                  ? await newRelationshipMappingFactory.create(property)
                  : propertyMappings[property.type](),
            };
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
