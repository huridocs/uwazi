import { ClientSession, Db } from 'mongodb';
import { Transactional } from '../services/Transactional';
import { MongoResultSet } from './MongoResultSet';

export class EntitiesDataSource implements Transactional<ClientSession> {
  private db: Db;

  private session?: ClientSession;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession): void {
    this.session = session;
  }

  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .countDocuments({ sharedId: { $in: sharedIds } }, { session: this.session });
    return countInExistence === sharedIds.length;
  }

  getByIds(sharedIds: string[]) {
    const cursor = this.db.collection('entities').find({ sharedId: { $in: sharedIds } });
    return new MongoResultSet(cursor, MongoResultSet.NoOpMapper);
  }
}
