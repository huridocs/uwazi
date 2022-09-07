import { ClientSession, Db, ObjectId } from 'mongodb';
import { Relationship } from '../model/Relationship';
import { Transactional } from '../services/Transactional';
import { CountDocument, MongoResultSet } from './MongoResultSet';
import { assignId, mapFromObjectIds, mapToObjectIds } from './dbMapper';

interface RelationshipDBO {
  _id: ObjectId;
  from: string;
  to: string;
  type: ObjectId;
}

interface RelationshipAggregatedResult {
  _id: ObjectId;
  from: {
    sharedId: string;
    title: string;
  };
  to: {
    sharedId: string;
    title: string;
  };
  type: ObjectId;
}
export class RelationshipsDataSource implements Transactional<ClientSession> {
  private db: Db;

  private session?: ClientSession;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession) {
    this.session = session;
  }

  private getCollection() {
    return this.db.collection<RelationshipDBO>('relationships');
  }

  async insert(relationship: Relationship): Promise<Relationship> {
    const {
      ops: [{ _id }],
    } = await this.getCollection().insertOne(mapToObjectIds(relationship, ['_id', 'type']), {
      session: this.session,
    });

    return mapFromObjectIds<RelationshipDBO, Relationship>(assignId(relationship, _id), ['_id']);
  }

  getByEntity(sharedId: string) {
    const totalCursor = this.getCollection().aggregate<CountDocument>([
      {
        $match: {
          $or: [{ from: sharedId }, { to: sharedId }],
        },
      },
      {
        $count: 'total',
      },
    ]);

    interface JoinedRelationship extends Omit<RelationshipDBO, 'from' | 'to'> {
      from: {
        sharedId: string;
        title: string;
      }[];
      to: {
        sharedId: string;
        title: string;
      }[];
    }

    const dataCursor = this.getCollection().aggregate<JoinedRelationship>([
      {
        $match: {
          $or: [{ from: sharedId }, { to: sharedId }],
        },
      },
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

    return new MongoResultSet(dataCursor, totalCursor, relationship => ({
      ...mapFromObjectIds<JoinedRelationship, RelationshipAggregatedResult>(relationship, ['_id']),
      from: {
        sharedId: relationship.from[0]?.sharedId,
        title: relationship.from[0]?.title,
      },
      to: {
        sharedId: relationship.to[0]?.sharedId,
        title: relationship.to[0]?.title,
      },
    }));
  }
}
