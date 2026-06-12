import type { AIAssistantPollScheduler } from './contracts/AIAssistantPollScheduler.js';
import type { AIAssistantService } from '../domain/AIAssistantService.js';
import type {
  AIAssistantContextPayload,
  UwaziCredentials,
} from '../domain/AIAssistantTypes.js';
import { formatAIAssistantMessage } from './formatAIAssistantMessage.js';

type Input = {
  tenantName: string;
  userId: string;
  sessionId: string;
  message: string;
  context: AIAssistantContextPayload;
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

class SendAIAssistantMessage {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    const { jobId } = await this.dependencies.aiAssistantService.submitMessage({
      message: formatAIAssistantMessage(input.message, input.context),
      credentials: input.credentials,
      jobId: input.conversationJobId,
    });

    await this.dependencies.pollScheduler.schedulePoll(
      {
        tenantName: input.tenantName,
        userId: input.userId,
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
