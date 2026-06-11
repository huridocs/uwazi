import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { AIAssistantPollRequestJob } from './jobs/AIAssistantPollRequestJob.js';
import { AIAssistantCancellationRegistry } from './AIAssistantCancellationRegistry.js';

const POLL_LOCK_WINDOW_MS = 10_000;

type PollJobParams = {
  tenantName: string;
  userId: string;
  sessionId: string;
  jobId: string;
};

class AIAssistantJobScheduler {
  static async schedulePoll(params: PollJobParams, delayMs = POLL_LOCK_WINDOW_MS) {
    const transactionManager = TransactionManagerFactory.default();
    const dispatcher = DefaultDispatcher(params.tenantName, transactionManager, {
      lockWindow: POLL_LOCK_WINDOW_MS,
      maxRetries: 60,
    });

    await dispatcher.dispatch(
      AIAssistantPollRequestJob,
      params,
      delayMs > 0 ? { lockedUntil: Date.now() + delayMs } : undefined
    );
  }

  static async cancelPolls(tenantName: string, jobId: string) {
    await AIAssistantCancellationRegistry.markCancelled(tenantName, jobId);

    const transactionManager = TransactionManagerFactory.default();
    const dispatcher = DefaultDispatcher(tenantName, transactionManager);

    await dispatcher.deleteByParams(AIAssistantPollRequestJob, { jobId });
  }
}

export { AIAssistantJobScheduler, POLL_LOCK_WINDOW_MS };
export type { PollJobParams };
