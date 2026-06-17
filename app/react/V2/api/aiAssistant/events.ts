const aiAssistantEvents = {
  reply: 'aiAssistant:reply',
  error: 'aiAssistant:error',
  progress: 'aiAssistant:progress',
} as const;

type AIAssistantReplyPayload = {
  jobId: string;
  message: string;
};

type AIAssistantErrorPayload = {
  jobId: string;
  error: string;
};

type AIAssistantProgressPayload = {
  jobId: string;
  progress: string;
};

export { aiAssistantEvents };
export type { AIAssistantErrorPayload, AIAssistantProgressPayload, AIAssistantReplyPayload };
