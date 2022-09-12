import { ClientSession, Db } from 'mongodb';
import { Transactional } from '../services/Transactional';

export abstract class MongoDataSource implements Transactional<ClientSession> {
  protected db: Db;

  protected session?: ClientSession;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession) {
    this.session = session;
  }
}
