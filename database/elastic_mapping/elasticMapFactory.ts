import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { RelationshipPropertyMappingFactory } from '#api/core/infrastructure/mongodb/template/mappings/RelationshipPropertyMappingFactory.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { propertyMappings } from './mappings.js';

const createNewRelationshipMappingFactory = async () => {
  const transactionManager = TransactionManagerFactory.default();
  const settingsDataSource = SettingsDataSourceFactory.default({ transactionManager });

  if (!(await settingsDataSource.readNewRelationshipsAllowed())) {
    return null;
  }

  const templateDataSource = TemplatesDataSourceFactory.default({ transactionManager });

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
