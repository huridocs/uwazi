import { MongoClient, ClientSession } from 'mongodb';
import { TransactionManager } from '../contracts/TransactionManager';

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  private session?: ClientSession;

  private onCommitHandlers: (() => Promise<void>)[];

  private finished = false;

  constructor(mongoClient: MongoClient) {
    this.onCommitHandlers = [];
    this.mongoClient = mongoClient;
  }

  private async executeOnCommitHandlers() {
    return Promise.all(this.onCommitHandlers.map(async handler => handler()));
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

  async run(callback: () => Promise<void>) {
    this.validateState();

    this.session = this.mongoClient.startSession();

    try {
      this.startTransaction();
      const returnValue = await callback();
      await this.commitTransaction();
      await this.executeOnCommitHandlers();
      return returnValue;
    } finally {
      this.session.endSession();
    }
  }

  getSession() {
    return this.session;
  }

  onCommmitted(handler: () => Promise<void>) {
    this.onCommitHandlers.push(handler);
  }
}
