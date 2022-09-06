import { ClientSession, Db, ObjectId } from 'mongodb';
import { Relationship } from '../model/Relationship';
import { Transactional } from '../services/Transactional';
import { assignId, mapFromObjectIds, mapToObjectIds } from './dbMapper';

export class RelationshipsDataSource implements Transactional<ClientSession> {
  private db: Db;

  private session?: ClientSession;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession) {
    this.session = session;
  }

  async insert(relationship: Relationship): Promise<Relationship> {
    const {
      ops: [{ _id }],
    } = await this.db
      .collection('relationships')
      .insertOne(mapToObjectIds(relationship, ['_id', 'type']), {
        session: this.session,
      });

    return mapFromObjectIds<Relationship>(assignId(relationship, _id as ObjectId), ['_id']);
  }
}
