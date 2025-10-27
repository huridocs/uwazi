import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { MongoSettingsDataSource } from 'api/core/infrastructure/mongodb/MongoSettingsDataSource';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema } from 'shared/types/commonTypes';

async function checkFeatureEnabled() {
  const db = getConnection();

  const transactionManager = TransactionManagerFactory.default();
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

async function createObsoleteMetadataResponseProcessor(
  hits: any[],
  language: string,
  featureEnabled = false
) {
  if (!featureEnabled) {
    return () => undefined;
  }

  const entitiesDataSource = DefaultEntitiesDataSource(TransactionManagerFactory.default());

  const obsoleteMetadataByEntity = await entitiesDataSource
    .getObsoleteMetadata(
      hits.map(h => h._source.sharedId),
      language
    )
    .indexed(entity => entity.sharedId);

  return (hit: any) => obsoleteMetadataByEntity[hit._source.sharedId]?.obsoleteMetadata ?? [];
}

async function createResponseProcessors(hits: any[], language: string) {
  const featureEnabled = await checkFeatureEnabled();
  return {
    metadata: createRelationshipsV2ResponseProcessor(featureEnabled),
    obsoleteMetadata: await createObsoleteMetadataResponseProcessor(hits, language, featureEnabled),
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
  createResponseProcessors,
  deducePropertyContent,
  getAggregatedIndexedPropertyPath,
  findDenormalizedProperty,
  getTypeToAggregate,
};
