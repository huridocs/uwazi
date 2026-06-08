import type { AIAssistantService } from '../domain/AIAssistantService.js';
import type { PollResult } from '../domain/AIAssistantTypes.js';

type Input = {
  jobId: string;
};

type Dependencies = {
  aiAssistantService: AIAssistantService;
};

class PollAIAssistantRequest {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<PollResult> {
    return this.dependencies.aiAssistantService.getJobStatus(input.jobId);
  }
}

export { PollAIAssistantRequest };
export type { Input as PollAIAssistantRequestInput };
