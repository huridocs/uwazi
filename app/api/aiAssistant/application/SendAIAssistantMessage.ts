import type { AIAssistantPollScheduler } from './contracts/AIAssistantPollScheduler.js';
import type { AIAssistantService } from './contracts/AIAssistantService.js';
import type { UwaziCredentials } from './contracts/AIAssistantContracts.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';

type Input = {
  tenantName: string;
  userId: string;
  sessionId: string;
  message: string;
  credentials: UwaziCredentials;
  conversationJobId?: string;
};

type Output = {
  jobId: string;
};

type Dependencies = {
  aiAssistantService: AIAssistantService;
  pollScheduler: AIAssistantPollScheduler;
};

class SendAIAssistantMessage extends AbstractUseCase<Input, Output, Dependencies> {
  async execute(input: Input): Promise<Output> {
    const { jobId } = await this.deps.aiAssistantService.submitMessage({
      message: input.message,
      credentials: input.credentials,
      jobId: input.conversationJobId,
    });

    await this.deps.pollScheduler.schedulePoll(
      {
        sessionId: input.sessionId,
        jobId,
      },
      0
    );

    return { jobId };
  }
}

export { SendAIAssistantMessage };
export type { Input as SendAIAssistantMessageInput, Output as SendAIAssistantMessageOutput };
