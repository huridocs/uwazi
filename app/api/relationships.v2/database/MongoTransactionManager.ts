import { MongoClient, ClientSession } from 'mongodb';
import { Transactional } from '../services/Transactional';
import { TransactionManager } from '../services/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  constructor(mongoClient: MongoClient) {
    this.mongoClient = mongoClient;
  }

  async run<D extends Transactional<ClientSession>[], T>(
    callback: (...deps: D) => Promise<T>,
    ...deps: D
  ): Promise<T> {
    let returnValue: T;
    await this.mongoClient.withSession(async session =>
      session.withTransaction(async () => {
        deps.forEach(dep => {
          dep.setTransactionContext(session);
        });
        returnValue = await callback(...deps);
      })
    );
    return returnValue!;
  }
}
