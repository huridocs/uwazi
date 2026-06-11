import type { AIAssistantService } from '../domain/AIAssistantService.js';
import type {
  AIAssistantContextPayload,
  UwaziCredentials,
} from '../domain/AIAssistantTypes.js';
import { formatAIAssistantMessage } from './formatAIAssistantMessage.js';
import { AIAssistantJobScheduler } from '../infrastructure/AIAssistantJobScheduler.js';
import { aiAssistantLog } from '../infrastructure/aiAssistantLog.js';

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
};

class SendAIAssistantMessage {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    aiAssistantLog('send.start', {
      tenantName: input.tenantName,
      userId: input.userId,
      sessionId: input.sessionId,
      conversationJobId: input.conversationJobId ?? null,
      messageLength: input.message.length,
    });

    const { jobId } = await this.dependencies.aiAssistantService.submitMessage({
      message: formatAIAssistantMessage(input.message, input.context),
      credentials: input.credentials,
      jobId: input.conversationJobId,
    });

    aiAssistantLog('send.submitted', { jobId, sessionId: input.sessionId });

    await AIAssistantJobScheduler.schedulePoll(
      {
        tenantName: input.tenantName,
        userId: input.userId,
        sessionId: input.sessionId,
        jobId,
      },
      0
    );

    aiAssistantLog('send.poll_scheduled', { jobId, delayMs: 0 });

    return { jobId };
  }
}

export { SendAIAssistantMessage };
export type { Input as SendAIAssistantMessageInput, Output as SendAIAssistantMessageOutput };
