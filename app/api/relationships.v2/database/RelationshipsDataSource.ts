import { ClientSession, Db, ObjectId } from 'mongodb';
import { Relationship } from '../model/Relationship';
import { Transactional } from '../services/Transactional';
import { MongoResultSet } from './MongoResultSet';
import { assignId, mapFromObjectIds, mapToObjectIds } from './dbMapper';

interface RelationshipDBO {
  _id: ObjectId;
  from: string;
  to: string;
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
    const cursor = this.getCollection().find(
      { $or: [{ from: sharedId }, { to: sharedId }] },
      { session: this.session }
    );

    return new MongoResultSet(cursor, (relationship: any) =>
      mapFromObjectIds<RelationshipDBO, Relationship>(relationship, ['_id'])
    );
  }
}
