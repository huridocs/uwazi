import { MongoClient, ClientSession } from 'mongodb';
import { Transactional } from '../contracts/Transactional';
import { TransactionManager } from '../contracts/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  constructor(mongoClient: MongoClient) {
    this.mongoClient = mongoClient;
  }

  async run<T>(callback: () => Promise<T>, ...deps: Transactional<ClientSession>[]): Promise<T> {
    let returnValue: T;
    await this.mongoClient.withSession(async session => {
      deps.forEach(dep => {
        dep.setTransactionContext(session);
      });
      await session.withTransaction(async () => {
        returnValue = await callback();
      });
    });

    deps.forEach(dep => {
      dep.clearTransactionContext();
    });

    return returnValue!;
  }
}
