/* eslint-disable class-methods-use-this */
import { ClientSession, MongoClient } from 'mongodb';
import { TransactionManager } from '../services/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  constructor(mongoClient: MongoClient) {
    this.mongoClient = mongoClient;
  }

  async run<T>(callback: (session: ClientSession) => Promise<T>): Promise<T> {
    let returnValue: T;
    await this.mongoClient.withSession(async session =>
      session.withTransaction(async () => {
        returnValue = await callback(session);
      })
    );
    return returnValue!;
  }
}
