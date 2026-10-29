import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  DispatchOptions,
} from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NamespacedDispatcher } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';

type ParamDefaults = {
  userId?: string;
  correlationId?: string;
  sessionId?: string;
};

function enrichParams(params: any, defaults: ParamDefaults): any {
  const enriched = { ...(params || {}) };
  (Object.keys(defaults) as (keyof ParamDefaults)[]).forEach(key => {
    if (!enriched[key] && defaults[key]) {
      enriched[key] = defaults[key];
    }
  });
  return enriched;
}

export type UwaziDispatcherDeps = {
  namespace: string;
  queueName: string;
  adapter: QueueAdapter;
  userId?: string;
  correlationId?: string;
  sessionId?: string;
};

export class UwaziDispatcher extends NamespacedDispatcher {
  private defaults: ParamDefaults;

  constructor(deps: UwaziDispatcherDeps) {
    super(deps.namespace, deps.queueName, deps.adapter);
    this.defaults = {
      userId: deps.userId,
      correlationId: deps.correlationId,
      sessionId: deps.sessionId,
    };
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): Promise<void> {
    return super.dispatch(dispatchable, enrichParams(params, this.defaults), options);
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
        dispatch(dispatchable, enrichParams(params, this.defaults), options);
      };
      return callback(enrichedDispatch);
    });
  }
}
