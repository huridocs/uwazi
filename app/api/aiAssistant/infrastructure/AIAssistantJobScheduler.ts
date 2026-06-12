import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import type {
  AIAssistantPollJobParams,
  AIAssistantPollScheduler,
} from '../application/contracts/AIAssistantPollScheduler.js';
import { AIAssistantPollRequestJob } from './jobs/AIAssistantPollRequestJob.js';
import { AIAssistantCancellationRegistry } from './AIAssistantCancellationRegistry.js';

const POLL_LOCK_WINDOW_MS = 10_000;

class AIAssistantJobScheduler implements AIAssistantPollScheduler {
  async schedulePoll(params: AIAssistantPollJobParams, delayMs = POLL_LOCK_WINDOW_MS) {
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

  async cancelPolls(tenantName: string, jobId: string) {
    await AIAssistantCancellationRegistry.markCancelled(tenantName, jobId);

    const transactionManager = TransactionManagerFactory.default();
    const dispatcher = DefaultDispatcher(tenantName, transactionManager);

    await dispatcher.deleteByParams(AIAssistantPollRequestJob, { jobId });
  }
}

const defaultAIAssistantPollScheduler = new AIAssistantJobScheduler();

export { AIAssistantJobScheduler, defaultAIAssistantPollScheduler, POLL_LOCK_WINDOW_MS };
export type { AIAssistantPollJobParams };
