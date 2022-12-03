import { ObjectId } from 'mongodb';
import { EntityData, GraphQueryResult, RelationshipData } from '../model/GraphQueryResult';
import { Relationship } from '../model/Relationship';
import { RelationshipDBOType, JoinedRelationshipDBOType } from './schemas/relationshipTypes';

type EntityTraversal = {
  _id: ObjectId;
  sharedId: string;
  title: string;
  traversal?: RelationshpTraversal;
};

type RelationshpTraversal = {
  _id: ObjectId;
  type: string;
  traversal?: EntityTraversal;
};

export const RelationshipMappers = {
  toDBO(relationship: Relationship) {
    return {
      _id: new ObjectId(relationship._id),
      from: relationship.from,
      to: relationship.to,
      type: new ObjectId(relationship.type),
    };
  },

  toModel(relationship: RelationshipDBOType) {
    return Relationship.create(
      relationship._id.toHexString(),
      relationship.from,
      relationship.to,
      relationship.type.toHexString()
    );
  },

  toAggregatedResult(joined: JoinedRelationshipDBOType) {
    return {
      _id: joined._id.toHexString(),
      from: {
        sharedId: joined.from[0]?.sharedId,
        title: joined.from[0]?.title,
      },
      to: {
        sharedId: joined.to[0]?.sharedId,
        title: joined.to[0]?.title,
      },
      type: joined.type.toHexString(),
    };
  },

  toGraphQueryResult(traversalResult: EntityTraversal) {
    const entities: EntityData[] = [];
    const relationships: RelationshipData[] = [];

    const visitors = {
      entity: ({ _id, traversal, ...entityData }: EntityTraversal) => {
        entities.push({ _id: _id.toHexString(), ...entityData });
        if (traversal) visitors.relationship(traversal);
      },
      relationship: ({ _id, traversal, ...relationshipData }: RelationshpTraversal) => {
        relationships.push({ _id: _id.toHexString(), ...relationshipData });
        if (traversal) visitors.entity(traversal);
      },
    };

    visitors.entity(traversalResult);
    return new GraphQueryResult(relationships, entities);
  },
};

export type TraversalResult = EntityTraversal;
