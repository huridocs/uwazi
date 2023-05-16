import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema } from 'shared/types/commonTypes';

async function checkFeatureEnabled() {
  const db = getConnection();
  const client = getClient();

  const transactionManager = new MongoTransactionManager(client);
  const settingsDataSource = new MongoSettingsDataSource(db, transactionManager);

  return settingsDataSource.readNewRelationshipsAllowed();
}

function createRelationshipsV2ResponseProcessor(featureEnabled = false) {
  if (!featureEnabled) {
    return (hit: any) => hit._source.metadata;
  }

  return (hit: any) => {
    const mappedMetadata = {} as any;
    Object.keys(hit._source.metadata || {}).forEach(propertyName => {
      mappedMetadata[propertyName] = (hit._source.metadata[propertyName] || []).map(
        ({ originalValue, ...rest }: any) => {
          if (originalValue) {
            return { ...originalValue, inheritedValue: [rest] };
          }
          return rest;
        }
      );
    });

    return mappedMetadata;
  };
}

function deducePropertyContent(property: PropertySchema, featureEnabled = false) {
  if (featureEnabled && property.type === propertyTypes.newRelationship) {
    // Placeholder: the content is not used if the aggregation values are entities.
    return 'template';
  }

  return undefined;
}

function getAggregatedIndexedPropertyPath(property: PropertySchema, featureEnabled = false) {
  if (featureEnabled && property.type === propertyTypes.newRelationship) {
    return `${property.name}.value`;
  }

  return undefined;
}

function findDenormalizedProperty(
  property: PropertySchema,
  allProperties: PropertySchema[],
  featureEnabled = false
) {
  if (featureEnabled && property.denormalizedProperty) {
    return allProperties.find(p => p.name === property.denormalizedProperty);
  }

  return property;
}

function getTypeToAggregate(
  property: PropertySchema,
  allProperties: PropertySchema[],
  featureEnabled = false
) {
  if (featureEnabled && property.type === propertyTypes.newRelationship) {
    if (property.denormalizedProperty) {
      return allProperties.find(p => p.name === property.denormalizedProperty)!.type;
    }

    return property.type;
  }

  return undefined;
}

export {
  checkFeatureEnabled,
  createRelationshipsV2ResponseProcessor,
  deducePropertyContent,
  getAggregatedIndexedPropertyPath,
  findDenormalizedProperty,
  getTypeToAggregate,
};
