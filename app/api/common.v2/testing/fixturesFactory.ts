import { ObjectId } from 'mongodb';

import { Property, PropertyTypes } from 'api/templates.v2/model/Property';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';

const getV2FixturesFactoryElements = (idMapper: (id: string) => ObjectId) => ({
  application: {
    property: (name: string, type: PropertyTypes, template: string): Property =>
      new Property(idMapper(name).toString(), type, name, name, idMapper(template).toString()),

    relationshipProperty: (
      name: string,
      template: string,
      query: MatchQueryNode['traversals'],
      denormalizedProperty?: string
    ): RelationshipProperty =>
      new RelationshipProperty(
        idMapper(name).toString(),
        name,
        name,
        query,
        idMapper(template).toString(),
        denormalizedProperty
      ),
  },

  database: {},

  api: {},
});

export { getV2FixturesFactoryElements };
