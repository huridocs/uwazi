import { emitToSession } from '#api/socketio/setupSockets.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { PollAIAssistantRequest } from '../../application/PollAIAssistantRequest.js';
import { AIAssistantCancellationRegistry } from '../AIAssistantCancellationRegistry.js';
import { aiAssistantLog } from '../aiAssistantLog.js';

type Params = UserAwareDispatchableParams & {
  sessionId: string;
  jobId: string;
};

type Dependencies = {
  pollUseCase: PollAIAssistantRequest;
};

class AIAssistantPollRequestJob extends UserAwareDispatchable<Params> {
  constructor(private dependencies: Dependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback) {
    aiAssistantLog('poll.handle.start', {
      tenantName: this.tenantName,
      jobId: this.params.jobId,
      sessionId: this.params.sessionId,
    });

    if (await AIAssistantCancellationRegistry.isCancelled(this.tenantName, this.params.jobId)) {
      aiAssistantLog('poll.handle.skip_cancelled', { jobId: this.params.jobId });
      return;
    }

    const result = await this.dependencies.pollUseCase.execute({
      jobId: this.params.jobId,
    });

    aiAssistantLog('poll.handle.result', {
      jobId: this.params.jobId,
      status: result.status,
    });

    if (await AIAssistantCancellationRegistry.isCancelled(this.tenantName, this.params.jobId)) {
      aiAssistantLog('poll.handle.skip_cancelled_after_poll', { jobId: this.params.jobId });
      return;
    }

    if (result.status === 'completed') {
      aiAssistantLog('poll.emit.reply', {
        jobId: this.params.jobId,
        sessionId: this.params.sessionId,
        messageLength: result.message.length,
      });
      emitToSession(this.params.sessionId, 'aiAssistant:reply', {
        jobId: this.params.jobId,
        message: result.message,
      });
      return;
    }

    if (result.status === 'error') {
      aiAssistantLog('poll.emit.error', {
        jobId: this.params.jobId,
        sessionId: this.params.sessionId,
        error: result.error,
      });
      emitToSession(this.params.sessionId, 'aiAssistant:error', {
        jobId: this.params.jobId,
        error: result.error,
      });
      return;
    }

    if (result.status === 'running') {
      aiAssistantLog('poll.emit.progress', {
        jobId: this.params.jobId,
        sessionId: this.params.sessionId,
        progressLength: result.progress.length,
      });
      emitToSession(this.params.sessionId, 'aiAssistant:progress', {
        jobId: this.params.jobId,
        progress: result.progress,
      });
    }

    aiAssistantLog('poll.reschedule', { jobId: this.params.jobId });
    const { AIAssistantJobScheduler } = await import('../AIAssistantJobScheduler.js');
    await AIAssistantJobScheduler.schedulePoll(this.params);
  }
}

export { AIAssistantPollRequestJob };
