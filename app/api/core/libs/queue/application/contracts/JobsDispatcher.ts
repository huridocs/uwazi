import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

export interface DispatchableClass<T extends Dispatchable> {
  new (...args: any[]): T;
}

export interface JobsDispatcher {
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
