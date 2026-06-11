import { emitToSession } from '#api/socketio/setupSockets.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { PollAIAssistantRequest } from '../../application/PollAIAssistantRequest.js';
import { AIAssistantCancellationRegistry } from '../AIAssistantCancellationRegistry.js';

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
    if (await AIAssistantCancellationRegistry.isCancelled(this.tenantName, this.params.jobId)) {
      return;
    }

    const result = await this.dependencies.pollUseCase.execute({
      jobId: this.params.jobId,
    });

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

    const { AIAssistantJobScheduler } = await import('../AIAssistantJobScheduler.js');
    await AIAssistantJobScheduler.schedulePoll(this.params);
  }
}

export { AIAssistantPollRequestJob };
