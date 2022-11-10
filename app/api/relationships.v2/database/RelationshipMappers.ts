import { ObjectId } from 'mongodb';
import { GraphQueryResult } from '../model/GraphQueryResult';
import { Relationship } from '../model/Relationship';
import { RelationshipDBOType, JoinedRelationshipDBOType } from './schemas/relationshipTypes';

type TraversalResult = {
  traversal?: TraversalResult;
};

function unrollTraversal({ traversal, ...rest }: TraversalResult): unknown[] {
  return [{ ...rest }].concat(traversal ? unrollTraversal(traversal) : []);
}

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

  toGraphQueryResult(traversal: TraversalResult) {
    return new GraphQueryResult(unrollTraversal(traversal));
  },
};
