import { Dispatchable } from './Dispatchable.js';

export interface DispatchableClass<T extends Dispatchable> {
  new (...args: any[]): T;
}

export interface JobsDispatcher {
  deleteByParams<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void>;

  dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
  ): Promise<void>;
  dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1]
      ) => void
    ) => Promise<void>
  ): Promise<void>;
}
