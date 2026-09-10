import { ClientSession } from 'mongodb';

interface OnCommitEmitter<T> {
  onCommitted(handler: (value: T) => Promise<void>): Promise<T>;
}

export interface TransactionManager {
  run<T>(callback: () => Promise<T>): Promise<T>;
  onCommitted(handler: () => Promise<void>): this;
  onRetry(handler: () => Promise<void>): this;
  runHandlingOnCommitted<T>(callback: () => Promise<T>): OnCommitEmitter<T>;
  isRunning(): boolean;
  /**
   * TEMPORARY migration bridge: returns the active Mongo session for
   * Mongo-backed data sources. Postgres has no session and returns undefined,
   * so those writes run session-less (auto-commit).
   * Remove from the contract once all Mongo consumers migrate to Postgres.
   */
  getSession(): ClientSession | undefined;
}
