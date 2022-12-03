import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
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
      _id: MongoIdHandler.mapToDb(relationship._id),
      from: relationship.from,
      to: relationship.to,
      type: MongoIdHandler.mapToDb(relationship.type),
    };
  },

  toModel(relationship: RelationshipDBOType) {
    return Relationship.create(
      MongoIdHandler.mapToApp(relationship._id),
      relationship.from,
      relationship.to,
      MongoIdHandler.mapToApp(relationship.type)
    );
  },

  toAggregatedResult(joined: JoinedRelationshipDBOType) {
    return {
      _id: MongoIdHandler.mapToApp(joined._id),
      from: {
        sharedId: joined.from[0]?.sharedId,
        title: joined.from[0]?.title,
      },
      to: {
        sharedId: joined.to[0]?.sharedId,
        title: joined.to[0]?.title,
      },
      type: MongoIdHandler.mapToApp(joined.type),
    };
  },

  toGraphQueryResult(traversalResult: EntityTraversal) {
    const entities: EntityData[] = [];
    const relationships: RelationshipData[] = [];

    const visitors = {
      entity: ({ _id, traversal, ...entityData }: EntityTraversal) => {
        entities.push({ _id: MongoIdHandler.mapToApp(_id), ...entityData });
        if (traversal) visitors.relationship(traversal);
      },
      relationship: ({ _id, traversal, ...relationshipData }: RelationshpTraversal) => {
        relationships.push({ _id: MongoIdHandler.mapToApp(_id), ...relationshipData });
        if (traversal) visitors.entity(traversal);
      },
    };

    visitors.entity(traversalResult);
    return new GraphQueryResult(relationships, entities);
  },
};

export type TraversalResult = EntityTraversal;
