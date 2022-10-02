import { MongoClient, ClientSession } from 'mongodb';
import { Transactional } from '../contracts/Transactional';
import { TransactionManager } from '../contracts/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  constructor(mongoClient: MongoClient) {
    this.mongoClient = mongoClient;
  }

  // eslint-disable-next-line class-methods-use-this
  async runInSession<T>(
    callback: () => Promise<T>,
    deps: Transactional<ClientSession>[],
    session: ClientSession
  ) {
    deps.forEach(dep => {
      dep.setTransactionContext(session);
    });
    const result = await callback();
    deps.forEach(dep => {
      dep.clearTransactionContext();
    });
    return result;
  }

  async run<T>(
    callback: () => Promise<T>,
    deps: Transactional<ClientSession>[],
    session?: ClientSession
  ): Promise<T> {
    if (session) {
      return this.runInSession(callback, deps, session);
    }

    let returnValue: T;
    await this.mongoClient.withSession(async newSession => {
      await newSession.withTransaction(async () => {
        returnValue = await this.runInSession(callback, deps, newSession);
      });
    });

    return returnValue!;
  }
}
