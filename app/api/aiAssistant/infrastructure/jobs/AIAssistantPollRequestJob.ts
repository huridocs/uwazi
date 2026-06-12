import { emitToSession } from '#api/socketio/setupSockets.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import type { AIAssistantPollScheduler } from '../../application/contracts/AIAssistantPollScheduler.js';
import { PollAIAssistantRequest } from '../../application/PollAIAssistantRequest.js';
import { AIAssistantCancellationRegistry } from '../AIAssistantCancellationRegistry.js';

type Params = UserAwareDispatchableParams & {
  sessionId: string;
  jobId: string;
};

type Dependencies = {
  pollUseCase: PollAIAssistantRequest;
  pollScheduler: AIAssistantPollScheduler;
};

const isLastRetry = (jobInfo?: JobInfo) =>
  Boolean(jobInfo && jobInfo.retryCount >= jobInfo.maxRetries);

class AIAssistantPollRequestJob extends UserAwareDispatchable<Params> {
  constructor(private dependencies: Dependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, jobInfo?: JobInfo) {
    if (await AIAssistantCancellationRegistry.isCancelled(this.tenantName, this.params.jobId)) {
      return;
    }

    let result;
    try {
      result = await this.dependencies.pollUseCase.execute({
        jobId: this.params.jobId,
      });
    } catch (error) {
      if (isLastRetry(jobInfo)) {
        emitToSession(this.params.sessionId, 'aiAssistant:error', {
          jobId: this.params.jobId,
          error:
            error instanceof Error
              ? error.message
              : 'AI Assistant could not complete your request. Try again.',
        });
      }
      throw error;
    }

    if (await AIAssistantCancellationRegistry.isCancelled(this.tenantName, this.params.jobId)) {
      return;
    }

    if (result.status === 'completed') {
      emitToSession(this.params.sessionId, 'aiAssistant:reply', {
        jobId: this.params.jobId,
        message: result.message,
      });
      return;
    }

    if (result.status === 'error') {
      emitToSession(this.params.sessionId, 'aiAssistant:error', {
        jobId: this.params.jobId,
        error: result.error,
      });
      return;
    }

    if (result.status === 'running') {
      emitToSession(this.params.sessionId, 'aiAssistant:progress', {
        jobId: this.params.jobId,
        progress: result.progress,
      });
    }

    await this.dependencies.pollScheduler.schedulePoll(this.params);
  }
}

export { AIAssistantPollRequestJob, isLastRetry };
