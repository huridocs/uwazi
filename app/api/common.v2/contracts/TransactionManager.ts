import { Transactional } from './Transactional';

export interface TransactionManager {
  run<T>(callback: () => Promise<T>, deps: Transactional<unknown>[], context?: unknown): Promise<T>;
}
