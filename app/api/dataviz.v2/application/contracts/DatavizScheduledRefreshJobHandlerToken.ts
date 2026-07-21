import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DispatchableClass } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

/** Job registry name — avoids application/infrastructure circular imports. */
export const DatavizScheduledRefreshJobHandlerToken = {
  name: 'DatavizScheduledRefreshJobHandler',
} as DispatchableClass<Dispatchable>;

/** Pre-rename queue job name; kept so pending jobs still execute and can be cancelled. */
export const DatavizScheduledRefreshJobLegacyToken = {
  name: 'DatavizScheduledRefreshJob',
} as DispatchableClass<Dispatchable>;

export const datavizScheduledRefreshJobTokens = [
  DatavizScheduledRefreshJobHandlerToken,
  DatavizScheduledRefreshJobLegacyToken,
] as const;
