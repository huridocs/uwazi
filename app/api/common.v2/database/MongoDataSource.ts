import { ClientSession, Db } from 'mongodb';
import { Transactional } from '../contracts/Transactional';

export abstract class MongoDataSource<CollectionSchema = any>
  implements Transactional<ClientSession>
{ // eslint-disable-line
  protected db: Db;

  protected session?: ClientSession;

  protected abstract collectionName: string;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession) {
    this.session = session;
  }

  clearTransactionContext(): void {
    this.session = undefined;
  }

  getCollection() {
    return this.db.collection<CollectionSchema>(this.collectionName);
  }
}
