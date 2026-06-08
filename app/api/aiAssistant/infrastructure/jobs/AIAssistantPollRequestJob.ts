import { emitToSession } from '#api/socketio/setupSockets.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { PollAIAssistantRequest } from '../../application/PollAIAssistantRequest.js';

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
    const result = await this.dependencies.pollUseCase.execute({
      jobId: this.params.jobId,
    });

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

    const { AIAssistantJobScheduler } = await import('../AIAssistantJobScheduler.js');
    await AIAssistantJobScheduler.schedulePoll(this.params);
  }
}

export { AIAssistantPollRequestJob };
