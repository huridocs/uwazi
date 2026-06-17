type AIAssistantPollJobParams = {
  sessionId: string;
  jobId: string;
};

interface AIAssistantPollScheduler {
  schedulePoll(params: AIAssistantPollJobParams, delayMs?: number): Promise<void>;
}

export type { AIAssistantPollJobParams, AIAssistantPollScheduler };
