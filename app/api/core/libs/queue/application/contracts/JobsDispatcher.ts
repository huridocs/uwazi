import { Dispatchable } from './Dispatchable.js';

export type DispatchOptions = {
  lockedUntil?: number;
};

export interface DispatchableClass<T extends Dispatchable> {
  new (...args: any[]): T;
}

export interface JobsDispatcher {
  deleteByParams<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void>;

  cancelByParams<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void>;

  dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): Promise<void>;
  dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1],
        options?: DispatchOptions
      ) => void
    ) => void | Promise<void>
  ): Promise<void>;
}
