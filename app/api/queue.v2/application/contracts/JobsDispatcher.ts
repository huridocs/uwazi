import { Dispatchable } from './Dispatchable';

export interface DispatchableClass<T extends Dispatchable> {
  new (...args: any[]): T;
}

export interface JobsDispatcher {
  dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
  ): Promise<void>;
}
