const aiAssistantEvents = {
  reply: 'aiAssistant:reply',
  error: 'aiAssistant:error',
} as const;

type AIAssistantReplyPayload = {
  jobId: string;
  message: string;
};

type AIAssistantErrorPayload = {
  jobId: string;
  error: string;
};

export { aiAssistantEvents };
export type { AIAssistantErrorPayload, AIAssistantReplyPayload };
