import type {
  PollResult,
  SubmitMessageInput,
  SubmitMessageOutput,
  UwaziCredentials,
} from './AIAssistantTypes.js';

interface AIAssistantService {
  submitMessage(input: SubmitMessageInput): Promise<SubmitMessageOutput>;
  getJobStatus(jobId: string): Promise<PollResult>;
  cancelJob(jobId: string, credentials: UwaziCredentials): Promise<void>;
}

export type { AIAssistantService };
