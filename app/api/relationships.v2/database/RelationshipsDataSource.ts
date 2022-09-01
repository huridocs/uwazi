/* eslint-disable max-classes-per-file */
import { ClientSession, Db, ObjectId } from 'mongodb';
import { Relationship } from '../model/Relationship';
import { Transactional } from '../services/Transactional';

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
    } = await this.db.collection('relationships').insertOne(
      {
        ...relationship,
        _id: new ObjectId(relationship._id),
        type: new ObjectId(relationship.type),
      },
      {
        session: this.session,
      }
    );

    return Object.assign(relationship, { _id: _id.toHexString() });
  }
}
