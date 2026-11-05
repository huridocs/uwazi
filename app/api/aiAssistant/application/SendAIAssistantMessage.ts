import { randomUUID } from 'node:crypto';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { User } from '#api/users.v2/model/User.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { AIAssistantPollScheduler } from './contracts/AIAssistantPollScheduler.js';
import type { AIAssistantService } from './contracts/AIAssistantService.js';
import type {
  AIAssistantContextPayload,
  UwaziCredentials,
} from './contracts/AIAssistantContracts.js';
import type { GetAIAssistantSettings } from './GetAIAssistantSettings.js';
import type { AgentLoopInput } from './runtime/AgentLoop.js';

type Input = {
  tenantName: string;
  userId: string;
  message: string;
  credentials?: UwaziCredentials;
  conversationJobId?: string;
  context?: AIAssistantContextPayload;
  actor?: User;
  language?: LanguageISO6391;
  sessionId?: string;
  protocol?: string;
  instanceHost?: string;
};

type Output = {
  jobId: string;
};

type Dependencies = {
  aiAssistantService: AIAssistantService;
  pollScheduler: AIAssistantPollScheduler;
  getSettings?: GetAIAssistantSettings;
  startLlmTurn?: (input: AgentLoopInput) => Promise<void>;
};

class SendAIAssistantMessage extends AbstractUseCase<Input, Output, Dependencies> {
  async execute(input: Input): Promise<Output> {
    const settings = this.deps.getSettings
      ? await this.deps.getSettings.execute({ includeSecrets: true })
      : { provider: 'bert-external' as const };

    if (settings.provider === 'bert-external') {
      return this.submitBert(input);
    }

    return this.submitLlm(input);
  }

  private async submitBert(input: Input): Promise<Output> {
    if (!input.credentials) {
      throw new Error('Password is required for Bert');
    }

    const { jobId } = await this.deps.aiAssistantService.submitMessage({
      message: input.message,
      credentials: input.credentials,
      jobId: input.conversationJobId,
    });

    await this.deps.pollScheduler.schedulePoll({ jobId }, 0);

    return { jobId };
  }

  private async submitLlm(input: Input): Promise<Output> {
    if (!this.deps.startLlmTurn) {
      throw new Error('LLM provider is not available');
    }
    if (!input.actor) {
      throw new Error('User is required');
    }

    const conversationId = input.conversationJobId ?? randomUUID();
    void this.deps.startLlmTurn({
      conversationId,
      message: input.message,
      context: input.context,
      actor: input.actor,
      language: input.language ?? 'en',
      sessionId: input.sessionId,
      protocol: input.protocol ?? 'http',
      instanceHost: input.instanceHost ?? '',
    });

    return { jobId: conversationId };
  }
}

export { SendAIAssistantMessage };
export type { Input as SendAIAssistantMessageInput, Output as SendAIAssistantMessageOutput };
