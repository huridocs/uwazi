import type { AIAssistantPollScheduler } from './contracts/AIAssistantPollScheduler.js';
import type { AIAssistantService } from '../domain/AIAssistantService.js';
import type { UwaziCredentials } from '../domain/AIAssistantTypes.js';

type Input = {
  tenantName: string;
  jobId: string;
  credentials: UwaziCredentials;
};

type Dependencies = {
  aiAssistantService: AIAssistantService;
  pollScheduler: AIAssistantPollScheduler;
};

class CancelAIAssistantConversation {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<void> {
    await this.dependencies.pollScheduler.cancelPolls(input.tenantName, input.jobId);

    try {
      await this.dependencies.aiAssistantService.cancelJob(input.jobId, input.credentials);
    } catch {
      // The external job may already be finished; local polling is already stopped.
    }
  }
}

export { CancelAIAssistantConversation };
export type { Input as CancelAIAssistantConversationInput };
