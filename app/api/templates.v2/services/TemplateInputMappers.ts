import { MongoIdHandler } from '../../common.v2/database/MongoIdGenerator.js';
import { MatchQueryNode } from '../../relationships.v2/model/MatchQueryNode.js';
import { TraversalQueryNode } from '../../relationships.v2/model/TraversalQueryNode.js';
import {
  MatchQuery,
  TraverseQuery,
  // @ts-expect-error TS(2307): Cannot find module '../../shared/types/api.v2/temp... Remove this comment to see the full error message
} from 'shared/types/api.v2/templates.createTemplateRequest.js';

import { PropertySchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/templateTyp... Remove this comment to see the full error message
import { TemplateSchema } from 'shared/types/templateType.js';
import { propertyTypes } from 'shared/propertyTypes.js';
import { ObjectId } from 'mongodb';
import { Property } from '../model/Property.js';
import { RelationshipProperty } from '../model/RelationshipProperty.js';
import { Template } from '../model/Template.js';
import { V1RelationshipProperty } from '../model/V1RelationshipProperty.js';
import { TemplateMappers } from '../database/TemplateMappers.js';
import { CommonProperty } from '../model/CommonProperty.js';

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
    // @ts-expect-error TS(2740): Type 'V1RelationshipProperty' is missing the follo... Remove this comment to see the full error message
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
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      template.properties?.map(p => propertyToApp(p, id)) || [],
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      (template.commonProperties?.map(p =>
        TemplateMappers.propertyToApp(p, ObjectId.createFromHexString(id))
      ) || []) as CommonProperty[]
    );
  },
};

export { BuildQuery, TemplateInputMappers };
export type { TemplateInput };
