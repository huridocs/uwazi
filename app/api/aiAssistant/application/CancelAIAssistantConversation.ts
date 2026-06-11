import type { AIAssistantService } from '../domain/AIAssistantService.js';
import type { UwaziCredentials } from '../domain/AIAssistantTypes.js';
import { AIAssistantJobScheduler } from '../infrastructure/AIAssistantJobScheduler.js';

type Input = {
  tenantName: string;
  jobId: string;
  credentials: UwaziCredentials;
};

type Dependencies = {
  aiAssistantService: AIAssistantService;
};

class CancelAIAssistantConversation {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<void> {
    await AIAssistantJobScheduler.cancelPolls(input.tenantName, input.jobId);

    try {
      await this.dependencies.aiAssistantService.cancelJob(input.jobId, input.credentials);
    } catch {
      // The external job may already be finished; local polling is already stopped.
    }
  }
}

export { CancelAIAssistantConversation };
export type { Input as CancelAIAssistantConversationInput };
