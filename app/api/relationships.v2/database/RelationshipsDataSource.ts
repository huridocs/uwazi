import { ObjectId } from 'mongodb';
import { Relationship } from '../model/Relationship';
import { CountDocument, MongoResultSet } from './MongoResultSet';
import { mapFromObjectIds, mapToObjectIds } from './dbMapper';
import { MongoDataSource } from './MongoDataSource';

interface RelationshipDBO {
  _id: ObjectId;
  from: string;
  to: string;
  type: ObjectId;
}

interface RelationshipAggregatedResult {
  _id: string;
  from: {
    sharedId: string;
    title: string;
  };
  to: {
    sharedId: string;
    title: string;
  };
  type: string;
}
export class RelationshipsDataSource extends MongoDataSource {
  private getCollection() {
    return this.db.collection<RelationshipDBO>('relationships');
  }

  async insert(relationship: Relationship): Promise<Relationship> {
    const {
      ops: [created],
    } = (await this.getCollection().insertOne(mapToObjectIds(relationship, ['_id', 'type']), {
      session: this.session,
    })) as { ops: RelationshipDBO[] };

    return mapFromObjectIds(created, ['_id', 'type']);
  }

  getByEntity(sharedId: string) {
    const matchStage = {
      $match: {
        $or: [{ from: sharedId }, { to: sharedId }],
      },
    };
    const totalCursor = this.getCollection().aggregate<CountDocument>([
      matchStage,
      {
        $count: 'total',
      },
    ]);

    interface JoinedRelationshipDBO extends Omit<RelationshipDBO, 'from' | 'to'> {
      from: {
        sharedId: string;
        title: string;
      }[];
      to: {
        sharedId: string;
        title: string;
      }[];
    }

    const dataCursor = this.getCollection().aggregate<JoinedRelationshipDBO>([
      matchStage,
      {
        $lookup: {
          from: 'entities',
          localField: 'from',
          foreignField: 'sharedId',
          as: 'from',
        },
      },
      {
        $lookup: {
          from: 'entities',
          localField: 'to',
          foreignField: 'sharedId',
          as: 'to',
        },
      },
    ]);

    return new MongoResultSet<JoinedRelationshipDBO, RelationshipAggregatedResult>(
      dataCursor,
      totalCursor,
      relationship => {
        const mapped = mapFromObjectIds(relationship, ['_id', 'type']);
        return {
          ...mapped,
          from: {
            sharedId: relationship.from[0]?.sharedId,
            title: relationship.from[0]?.title,
          },
          to: {
            sharedId: relationship.to[0]?.sharedId,
            title: relationship.to[0]?.title,
          },
        };
      }
    );
  }
}
