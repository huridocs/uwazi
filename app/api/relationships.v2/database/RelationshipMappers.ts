import { ObjectId } from 'mongodb';
import { Relationship } from '../model/Relationship';
import { JoinedRelationshipDBO, RelationshipDBO } from './RelationshipsTypes';

export const RelationshipMappers = {
  toDBO(relationship: Relationship) {
    return {
      _id: new ObjectId(relationship._id),
      from: relationship.from,
      to: relationship.to,
      type: new ObjectId(relationship.type),
    };
  },

  toModel(relationship: RelationshipDBO) {
    return new Relationship(
      relationship._id.toHexString(),
      relationship.from,
      relationship.to,
      relationship.type.toHexString()
    );
  },

  toAggregatedResult(joined: JoinedRelationshipDBO) {
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
};
