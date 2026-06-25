import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DispatchableClass } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

/** Job registry name — avoids application/infrastructure circular imports. */
export const DatavizScheduledRefreshJobHandlerToken = {
  name: 'DatavizScheduledRefreshJobHandler',
} as DispatchableClass<Dispatchable>;
