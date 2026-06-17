import type {
  AIAssistantPollJobParams,
  AIAssistantPollScheduler,
} from '../application/contracts/AIAssistantPollScheduler.js';
import { AIAssistantPollRequestJob } from './jobs/AIAssistantPollRequestJob.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

type Dependencies = {
  dispatcher: JobsDispatcher;
};

class AIAssistantJobScheduler implements AIAssistantPollScheduler {
  constructor(private deps: Dependencies) {}

  async schedulePoll(params: AIAssistantPollJobParams, delayMs = 10_000) {
    await this.deps.dispatcher.dispatch(
      AIAssistantPollRequestJob,
      params,
      delayMs > 0 ? { lockedUntil: Date.now() + delayMs } : undefined
    );
  }
}

export { AIAssistantJobScheduler };
export type { AIAssistantPollJobParams };
