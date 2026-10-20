import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  DispatchOptions,
} from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NamespacedDispatcher } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';

function enrichParams(params: any, defaultUserId?: string, defaultCorrelationId?: string): any {
  const enriched = { ...(params || {}) };
  if (!enriched.userId && defaultUserId) {
    enriched.userId = defaultUserId;
  }
  if (!enriched.correlationId && defaultCorrelationId) {
    enriched.correlationId = defaultCorrelationId;
  }
  return enriched;
}

export type UwaziDispatcherDeps = {
  namespace: string;
  queueName: string;
  adapter: QueueAdapter;
  userId?: string;
  correlationId?: string;
};

export class UwaziDispatcher extends NamespacedDispatcher {
  private defaultUserId?: string;

  private defaultCorrelationId?: string;

  constructor(deps: UwaziDispatcherDeps) {
    super(deps.namespace, deps.queueName, deps.adapter);
    this.defaultUserId = deps.userId;
    this.defaultCorrelationId = deps.correlationId;
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): Promise<void> {
    return super.dispatch(
      dispatchable,
      enrichParams(params, this.defaultUserId, this.defaultCorrelationId),
      options
    );
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
        dispatch(
          dispatchable,
          enrichParams(params, this.defaultUserId, this.defaultCorrelationId),
          options
        );
      };
      return callback(enrichedDispatch);
    });
  }
}
