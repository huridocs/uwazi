import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { JobsRouter } from '#api/core/libs/queue/infrastructure/JobsRouter.js';
import { DefaultQueueAdapter } from '#api/core/libs/queue/configuration/factories.js';
import { QueueOptions } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UwaziDispatcher } from './UwaziDispatcher.js';

export function UwaziDispatcherFactory(
  tenant: string,
  transactionManager: TransactionManager,
  queueOptions?: QueueOptions,
  queueAdapter?: QueueAdapter
): JobsDispatcher {
  const defaultUserId = ExecutionContext.actor?._id;
  return new JobsRouter(
    queueName =>
      new UwaziDispatcher(
        tenant,
        queueName,
        queueAdapter || DefaultQueueAdapter(transactionManager),
        queueOptions,
        defaultUserId
      )
  );
}
