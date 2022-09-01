import { ClientSession, Db } from 'mongodb';
import { Transactional } from '../services/Transactional';

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
      .countDocuments({ sharedId: { $in: sharedIds } });
    return countInExistence === sharedIds.length;
  }
}
