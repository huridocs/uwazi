import { ClientSession, Db } from 'mongodb';
import { Transactional } from './Transactional';

export class RelationshipsDataSource implements Transactional {
  private db: Db;

  private session?: ClientSession;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession) {
    this.session = session;
  }

  async insert(relationship: any) {
    const {
      ops: [created],
    } = await this.db
      .collection('relationships')
      .insertOne(relationship, { session: this.session });

    return created;
  }
}
