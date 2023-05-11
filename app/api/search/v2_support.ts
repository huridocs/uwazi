import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { QueryMapper } from 'api/templates.v2/database/QueryMapper';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema } from 'shared/types/commonTypes';

function deducePropertyContent(property: PropertySchema) {
  if (property.type === propertyTypes.newRelationship) {
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

function getAggregatedIndexedPropertyPath(property: PropertySchema) {
  if (property.type === propertyTypes.newRelationship) {
    return `${property.name}.value`;
  }

  return undefined;
}

function findDenormalizedProperty(property: PropertySchema, allProperties: PropertySchema[]) {
  if (property.denormalizedProperty) {
    return allProperties.find(p => p.name === property.denormalizedProperty);
  }

  return property;
}

function getTypeToAggregate(property: PropertySchema, allProperties: PropertySchema[]) {
  if (property.type === propertyTypes.newRelationship) {
    if (property.denormalizedProperty) {
      return allProperties.find(p => p.name === property.denormalizedProperty)!.type;
    }

    return property.type;
  }

  return undefined;
}

export {
  deducePropertyContent,
  getAggregatedIndexedPropertyPath,
  findDenormalizedProperty,
  getTypeToAggregate,
};
