import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { MatchQuery, TraverseQuery } from 'shared/types/api.v2/templates.createTemplateRequest';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { propertyTypes } from 'shared/propertyTypes';
import { ObjectId } from 'mongodb';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';
import { V1RelationshipProperty } from '../model/V1RelationshipProperty';
import { TemplateMappers } from '../database/TemplateMappers';
import { CommonProperty } from '../model/CommonProperty';

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
      (template.commonProperties?.map(p =>
        TemplateMappers.propertyToApp(p, ObjectId.createFromHexString(id))
      ) || []) as CommonProperty[]
    );
  },
};

export { BuildQuery, TemplateInputMappers };
export type { TemplateInput };
