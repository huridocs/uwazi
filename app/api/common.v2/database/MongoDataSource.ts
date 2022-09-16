import { ClientSession, Db } from 'mongodb';
import { Transactional } from '../contracts/Transactional';
import { TransactionContextAlreadySetError } from './errors/TransactionContextAlreadySetError';

export abstract class MongoDataSource implements Transactional<ClientSession> {
  protected db: Db;

  protected session?: ClientSession;

  constructor(db: Db) {
    this.db = db;
  }

  setTransactionContext(session: ClientSession) {
    if (this.session) {
      throw new TransactionContextAlreadySetError();
    }

    this.session = session;
  }

  clearTransactionContext(): void {
    this.session = undefined;
  }
}
