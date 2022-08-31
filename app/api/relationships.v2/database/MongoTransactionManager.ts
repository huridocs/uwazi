/* eslint-disable class-methods-use-this */
import { ClientSession, MongoClient } from 'mongodb';
import { TransactionManager } from '../services/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  constructor(mongoClient: MongoClient) {
    this.mongoClient = mongoClient;
  }

  async run<T>(callback: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = this.mongoClient.startSession();
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      // @ts-ignore
      return result;
    } finally {
      await session.endSession();
    }
  }
}
