export interface TransactionManager {
  run(callback: () => Promise<void>): Promise<void>;
  onCommmitted(handler: () => Promise<void>): void;
}
