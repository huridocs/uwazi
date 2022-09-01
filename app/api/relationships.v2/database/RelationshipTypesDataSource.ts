import { ClientSession, Db, ObjectId } from 'mongodb';
import { Transactional } from '../services/Transactional';

export class RelationshipTypesDataSource implements Transactional<ClientSession> {
  private db: Db;

  private session?: ClientSession;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession): void {
    this.session = session;
  }

  async typesExist(ids: string[]) {
    const countInExistence = await this.db
      .collection('relationtypes')
      .countDocuments({ _id: { $in: ids.map(id => new ObjectId(id)) } }, { session: this.session });
    return countInExistence === ids.length;
  }
}
