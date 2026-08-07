import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  DispatchOptions,
} from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NamespacedDispatcher, QueueOptions } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';

function enrichParams(params: any, defaultUserId?: string): any {
  if (params?.userId) return params;
  const actor = ExecutionContext.actor;
  const userId = actor?._id ?? defaultUserId ?? User.system()._id;
  return { ...(params || {}), userId };
}

export class UwaziDispatcher extends NamespacedDispatcher {
  constructor(
    namespace: string,
    queueName: string,
    adapter: QueueAdapter,
    options?: QueueOptions,
    private defaultUserId?: string
  ) {
    super(namespace, queueName, adapter, options);
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): Promise<void> {
    return super.dispatch(dispatchable, enrichParams(params, this.defaultUserId), options);
  }

  async dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1],
        options?: DispatchOptions
      ) => void
    ) => void | Promise<void>
  ): Promise<void> {
    return super.dispatchMany(async dispatch => {
      const enrichedDispatch = <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1],
        options?: DispatchOptions
      ): void => {
        dispatch(dispatchable, enrichParams(params, this.defaultUserId), options);
      };
      return callback(enrichedDispatch);
    });
  }
}
