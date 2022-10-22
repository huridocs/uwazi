import { MongoClient, ClientSession } from 'mongodb';
import { TransactionManager } from '../contracts/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  private session?: ClientSession;

  private onCommitHandlers: ((returnValue: any) => Promise<void>)[];

  private finished = false;

  constructor(mongoClient: MongoClient) {
    this.onCommitHandlers = [];
    this.mongoClient = mongoClient;
  }

  private async executeOnCommitHandlers(returnValue: unknown) {
    return Promise.all(this.onCommitHandlers.map(async handler => handler(returnValue)));
  }

  private validateState() {
    if (this.session) {
      if (this.finished) {
        throw new Error('Transaction already finished.');
      }

      throw new Error('Transaction already in progress.');
    }
  }

  private async commitTransaction() {
    await this.session!.commitTransaction();
    this.finished = true;
  }

  private startTransaction() {
    this.session!.startTransaction();
  }

  async run<T>(callback: () => Promise<T>) {
    this.validateState();

    this.session = this.mongoClient.startSession();

    try {
      this.startTransaction();
      const returnValue = await callback();
      await this.commitTransaction();
      await this.executeOnCommitHandlers(returnValue);
      return returnValue;
    } finally {
      this.session.endSession();
    }
  }

  runHandlingOnCommitted<T>(callback: () => Promise<T>) {
    return {
      onCommitted: async (handler: (returnValue: T) => Promise<void>) => {
        this.onCommitHandlers.push(handler);
        return this.run(callback);
      },
    };
  }

  getSession() {
    return this.session;
  }

  onCommitted(handler: () => Promise<void>) {
    this.onCommitHandlers.push(handler);
    return this;
  }
}
