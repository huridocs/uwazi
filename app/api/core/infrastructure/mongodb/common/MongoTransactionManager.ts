import { MongoClient, ClientSession } from 'mongodb';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TransactionManager } from '../../../application/contracts/TransactionManager.js';
import { OptimisticLockError } from './OptimisticLockError.js';

type CommitHandler = (returnValue: unknown) => Promise<void>;
type RetryHandler = () => Promise<void>;

export class MongoTransactionManager implements TransactionManager {
  private mongoClient: MongoClient;

  private logger: Logger;

  private session?: ClientSession;

  private persistentOnCommitHandlers: CommitHandler[];

  private persistentOnRetryHandlers: RetryHandler[];

  private runOnCommitHandlers: CommitHandler[];

  private runOnRetryHandlers: RetryHandler[];

  private finished = false;

  constructor(mongoClient: MongoClient, logger: Logger) {
    this.persistentOnCommitHandlers = [];
    this.persistentOnRetryHandlers = [];
    this.runOnCommitHandlers = [];
    this.runOnRetryHandlers = [];
    this.mongoClient = mongoClient;
    this.logger = logger;
  }

  async executeOnCommitHandlers(returnValue: unknown) {
    return Promise.all(
      [...this.persistentOnCommitHandlers, ...this.runOnCommitHandlers].map(async handler =>
        handler(returnValue)
      )
    );
  }

  async executeOnRetryHandlers() {
    return Promise.all(
      [...this.persistentOnRetryHandlers, ...this.runOnRetryHandlers].map(async handler =>
        handler()
      )
    );
  }

  private clearRunHandlers() {
    this.runOnCommitHandlers = [];
    this.runOnRetryHandlers = [];
  }

  private validateState() {
    if (this.session) {
      if (this.finished) {
        throw new Error('Transaction already finished.');
      }

      throw new Error('Transaction already in progress.');
    }
  }

  private async commitWithRetry() {
    try {
      if (!this.finished) {
        await this.session!.commitTransaction();
        this.finished = true;
      }
    } catch (error) {
      if (error.hasErrorLabel && error.hasErrorLabel('UnknownTransactionCommitResult')) {
        this.logger.debug(error);
        await this.commitWithRetry();
      } else {
        throw error;
      }
    }
  }

  private startTransaction() {
    this.session!.startTransaction();
  }

  private async abortTransaction() {
    await this.session!.abortTransaction();
  }

  private async runInTransaction<T>(callback: () => Promise<T>) {
    this.startTransaction();
    try {
      const returnValue = await callback();
      await this.commitWithRetry();
      return returnValue;
    } catch (error) {
      if (this.session?.inTransaction()) {
        await this.abortTransaction();
      }

      throw error;
    }
  }

  private static isWriteConflict(error: unknown): boolean {
    return error instanceof OptimisticLockError;
  }

  private static isTransientTransactionError(error: unknown): boolean {
    const mongoError = error as { hasErrorLabel?: (label: string) => boolean };
    return Boolean(
      mongoError.hasErrorLabel && mongoError.hasErrorLabel('TransientTransactionError')
    );
  }

  private static shouldRetry(error: unknown, retries: number): boolean {
    return (
      retries > 0 &&
      (MongoTransactionManager.isTransientTransactionError(error) ||
        MongoTransactionManager.isWriteConflict(error))
    );
  }

  private async runRetry<T>(
    callback: () => Promise<T>,
    error: unknown,
    retries: number
  ): Promise<T> {
    this.logger.debug(error as any);
    await this.executeOnRetryHandlers();
    return this.runWithRetry(callback, retries - 1);
  }

  private async runWithRetry<T>(callback: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await this.runInTransaction(callback);
    } catch (error) {
      if (MongoTransactionManager.shouldRetry(error, retries)) {
        return this.runRetry(callback, error, retries);
      }

      throw error;
    }
  }

  // for v1 compatibility
  async abort() {
    if (this.session?.inTransaction()) {
      await this.session.abortTransaction();
    }
    this.finished = true;
  }

  isRunning(): boolean {
    return !!this.session?.inTransaction();
  }

  private prepareRun() {
    this.validateState();
    this.clearRunHandlers();
    this.session = this.mongoClient.startSession();
  }

  private async finishRun() {
    this.clearRunHandlers();
    await this.session!.endSession();
    this.session = undefined;
    this.finished = false;
  }

  private async executeRunCallback<T>(callback: () => Promise<T>) {
    const returnValue = await this.runWithRetry(callback);
    await this.executeOnCommitHandlers(returnValue);
    return returnValue;
  }

  async run<T>(callback: () => Promise<T>) {
    this.prepareRun();

    try {
      return await this.executeRunCallback(callback);
    } finally {
      await this.finishRun();
    }
  }

  runHandlingOnCommitted<T>(callback: () => Promise<T>) {
    return {
      onCommitted: async (handler: (returnValue: T) => Promise<void>) =>
        this.run(async () => {
          const returnValue = await callback();
          this.runOnCommitHandlers.push(async () => handler(returnValue));
          return returnValue;
        }),
    };
  }

  getSession() {
    return this.session;
  }

  onCommitted(handler: () => Promise<void>) {
    if (this.isRunning()) {
      this.runOnCommitHandlers.push(handler);
    } else {
      this.persistentOnCommitHandlers.push(handler);
    }
    return this;
  }

  onRetry(handler: () => Promise<void>) {
    if (this.isRunning()) {
      this.runOnRetryHandlers.push(handler);
    } else {
      this.persistentOnRetryHandlers.push(handler);
    }
    return this;
  }
}
