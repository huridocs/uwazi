import { Transactional } from './Transactional';

export interface TransactionManager {
  run<D extends Transactional<unknown>[], T>(
    callback: (...deps: D) => Promise<T>,
    ...deps: D
  ): Promise<T>;
}
