import { ClientSession, Db } from 'mongodb';
import { Transactional } from './Transactional';

export class EntitiesDataSource implements Transactional {
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
      .find(
        { sharedId: { $in: sharedIds } },
        { projection: { sharedId: 1 }, session: this.session }
      )
      .count();
    return countInExistence === sharedIds.length;
  }
}
