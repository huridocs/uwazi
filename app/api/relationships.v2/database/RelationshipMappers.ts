import { ObjectId } from 'mongodb';
import { GraphQueryResult } from '../model/GraphQueryResult';
import { Relationship, ApplicationRelationshipType } from '../model/Relationship';
import { RelationshipDBOType, JoinedRelationshipDBOType } from './schemas/relationshipTypes';

type TraversalResult = {
  traversal?: TraversalResult;
};

function unrollTraversal({ traversal, ...rest }: TraversalResult): unknown[] {
  return [{ ...rest }].concat(traversal ? unrollTraversal(traversal) : []);
}

export const RelationshipMappers = {
  partialToDBO(relationshipInfo: Partial<ApplicationRelationshipType>) {
    const transformed: Partial<RelationshipDBOType> = {};
    if (relationshipInfo._id) transformed._id = new ObjectId(relationshipInfo._id);
    if (relationshipInfo.from) transformed.from = relationshipInfo.from;
    if (relationshipInfo.to) transformed.to = relationshipInfo.to;
    if (relationshipInfo.type) transformed.type = new ObjectId(relationshipInfo.type);
    return transformed;
  },

  toDBO(relationship: Relationship) {
    return {
      _id: new ObjectId(relationship._id),
      from: relationship.from,
      to: relationship.to,
      type: new ObjectId(relationship.type),
    };
  },

  toModel(relationship: RelationshipDBOType) {
    return new Relationship(
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
