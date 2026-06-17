import type {
  PollResult,
  SubmitMessageInput,
  SubmitMessageOutput,
} from './AIAssistantContracts.js';

interface AIAssistantService {
  submitMessage(input: SubmitMessageInput): Promise<SubmitMessageOutput>;
  getJobStatus(jobId: string): Promise<PollResult>;
}

export type { AIAssistantService };
