import { MongoClient, ClientSession } from 'mongodb';
import { Transactional } from '../contracts/Transactional';
import { TransactionManager } from '../contracts/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  private session?: ClientSession;

  constructor(mongoClient: MongoClient) {
    this.mongoClient = mongoClient;
  }

  private async runWithSession<T>(
    callback: () => Promise<T>,
    deps: Transactional<ClientSession>[]
  ) {
    deps.forEach(dep => {
      dep.setTransactionContext(this.session!);
    });
    const result = await callback();
    deps.forEach(dep => {
      dep.clearTransactionContext();
    });
    return result;
  }

  private async initiateTransactionAndRun<T>(
    callback: () => Promise<T>,
    deps: Transactional<ClientSession>[]
  ) {
    let returnValue: T;
    await this.mongoClient.withSession(async newSession => {
      this.session = newSession;
      await newSession.withTransaction(async () => {
        returnValue = await this.runWithSession(callback, deps);
      });
    });
    this.session = undefined;
    return returnValue!;
  }

  async run<T>(callback: () => Promise<T>, deps: Transactional<ClientSession>[]): Promise<T> {
    if (this.session) {
      return this.runWithSession(callback, deps);
    }

    return this.initiateTransactionAndRun(callback, deps);
  }
}
