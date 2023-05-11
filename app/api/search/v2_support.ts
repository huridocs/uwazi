import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { QueryMapper } from 'api/templates.v2/database/QueryMapper';
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
    return (hit: unknown) => hit;
  }

  return (hit: any) => {
    const mappedMetadata: any = {};
    Object.keys(hit._source.metadata || {}).forEach(propertyName => {
      mappedMetadata[propertyName] = hit._source.metadata[propertyName].map(
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
    const query = MatchQueryNode.forAnyEntity(QueryMapper.toModel(property.query as any));
    const templates = query
      .getTemplatesInLeaves()
      .map(record => record.templates)
      .flat();

    // if (templates.length !== 1) {
    //   throw createError(
    //     `Cannot aggregate with more than one template as content: ${property.name}`
    //   );
    // }

    const [template] = templates;

    return template;
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
