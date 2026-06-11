import type { AIAssistantService } from '../domain/AIAssistantService.js';
import type { UwaziCredentials } from '../domain/AIAssistantTypes.js';
import { AIAssistantJobScheduler } from '../infrastructure/AIAssistantJobScheduler.js';
import { aiAssistantLog } from '../infrastructure/aiAssistantLog.js';

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
    aiAssistantLog('cancel.start', { tenantName: input.tenantName, jobId: input.jobId });

    await AIAssistantJobScheduler.cancelPolls(input.tenantName, input.jobId);

    try {
      await this.dependencies.aiAssistantService.cancelJob(input.jobId, input.credentials);
      aiAssistantLog('cancel.done', { jobId: input.jobId });
    } catch (error) {
      aiAssistantLog('cancel.external_failed', {
        jobId: input.jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      // The external job may already be finished; local polling is already stopped.
    }
  }
}

export { CancelAIAssistantConversation };
export type { Input as CancelAIAssistantConversationInput };
