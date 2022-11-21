interface OnCommitEmitter<T> {
  onCommitted(handler: (value: T) => Promise<void>): Promise<T>;
}

export interface TransactionManager {
  run<T>(callback: () => Promise<T>): Promise<T>;
  onCommitted(handler: () => Promise<void>): this;
  runHandlingOnCommitted<T>(callback: () => Promise<T>): OnCommitEmitter<T>;
}
