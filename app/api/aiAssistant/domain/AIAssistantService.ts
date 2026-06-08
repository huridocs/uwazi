import type {
  PollResult,
  SubmitMessageInput,
  SubmitMessageOutput,
} from './AIAssistantTypes.js';

interface AIAssistantService {
  submitMessage(input: SubmitMessageInput): Promise<SubmitMessageOutput>;
  getJobStatus(jobId: string): Promise<PollResult>;
}

export type { AIAssistantService };
