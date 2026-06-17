import { emitToSession } from '#api/socketio/setupSockets.js';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import type { AIAssistantPollScheduler } from '../../application/contracts/AIAssistantPollScheduler.js';
import type { AIAssistantService } from '../../domain/AIAssistantService.js';

type Params = {
  sessionId: string;
  jobId: string;
};

type Dependencies = {
  aiAssistantService: AIAssistantService;
  pollScheduler: AIAssistantPollScheduler;
};

const isLastRetry = (jobInfo?: JobInfo) =>
  Boolean(jobInfo && jobInfo.retryCount >= jobInfo.maxRetries);

class AIAssistantPollRequestJob implements Dispatchable {
  constructor(private deps: Dependencies) {}

  async handleDispatch(_heartbeat: HeartbeatCallback, params: Params, jobInfo?: JobInfo) {
    let result;
    try {
      result = await this.deps.aiAssistantService.getJobStatus(params.jobId);
    } catch (error) {
      if (isLastRetry(jobInfo)) {
        emitToSession(params.sessionId, 'aiAssistant:error', {
          jobId: params.jobId,
          error:
            error instanceof Error
              ? error.message
              : 'AI Assistant could not complete your request. Try again.',
        });
      }
      throw error;
    }

    if (result.status === 'completed') {
      emitToSession(params.sessionId, 'aiAssistant:reply', {
        jobId: params.jobId,
        message: result.message,
      });
      return;
    }

    if (result.status === 'error') {
      emitToSession(params.sessionId, 'aiAssistant:error', {
        jobId: params.jobId,
        error: result.error,
      });
      return;
    }

    if (result.status === 'running') {
      emitToSession(params.sessionId, 'aiAssistant:progress', {
        jobId: params.jobId,
        progress: result.progress,
      });
    }

    await this.deps.pollScheduler.schedulePoll(params);
  }
}

export { AIAssistantPollRequestJob };
