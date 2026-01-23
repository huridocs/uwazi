import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoTemplatePropertyMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { MatchQueryNode } from '#api/relationships.v2/model/MatchQueryNode.js';
import { TraversalQueryNode } from '#api/relationships.v2/model/TraversalQueryNode.js';
import { MatchQuery, TraverseQuery } from '#shared/types/api.v2/templates.createTemplateRequest.js';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import { Property } from '#api/core/domain/template/Property.js';
import { RelationshipProperty } from '#api/core/domain/template/RelationshipProperty.js';
import { Template } from '#api/core/domain/template/Template.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { CommonProperty } from '#api/core/domain/template/CommonProperty.js';

const BuildQuery = {
  traverse: (query: TraverseQuery): TraversalQueryNode =>
    new TraversalQueryNode(
      query.direction,
      { types: query.types },
      query.match.map(BuildQuery.match)
    ),
  match: (query: MatchQuery): MatchQueryNode =>
    new MatchQueryNode(
      { templates: query.templates },
      query.traverse?.map(BuildQuery.traverse) ?? []
    ),
  build: (traversals: TraverseQuery[]) =>
    new MatchQueryNode({}, traversals.map(BuildQuery.traverse)),
};

type TemplateInput = TemplateSchema;

const propertyToApp = (property: PropertySchema, templateId: string): Property => {
  const propertyId = property._id?.toString() || MongoIdHandler.generate();
  const { query } = property;
  if (property.type === propertyTypes.newRelationship) {
    return new RelationshipProperty(
      propertyId,
      property.name,
      property.label,
      (query as TraverseQuery[]).map(BuildQuery.traverse),
      templateId,
      property.denormalizedProperty
    );
  }
  if (property.type === propertyTypes.relationship) {
    if (!property.relationType) throw new Error('Relation type is required');
    return new V1RelationshipProperty(
      propertyId,
      property.name,
      property.label,
      property.relationType,
      templateId,
      property.content,
      property.inherit?.property
    );
  }
  return new Property({
    id: propertyId,
    type: property.type,
    name: property.name,
    label: property.label,
    template: templateId,
  });
};

const TemplateInputMappers = {
  queryToApp: BuildQuery.build,
  propertyToApp,
  toApp: (template: TemplateInput): Template => {
    const id = template._id?.toString() || MongoIdHandler.generate();
    return new Template(
      id,
      template.name,
      template.properties?.map(p => propertyToApp(p, id)) || [],
      (template.commonProperties?.map(p => MongoTemplatePropertyMapper.toDomain(p, id)) ||
        []) as CommonProperty[]
    );
  },
};

export { BuildQuery, TemplateInputMappers };
export type { TemplateInput };
