const aiAssistantEvents = {
  reply: 'aiAssistant:reply',
  error: 'aiAssistant:error',
  progress: 'aiAssistant:progress',
  toolConfirm: 'aiAssistant:tool_confirm',
  toolActivity: 'aiAssistant:tool_activity',
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

type AIAssistantToolConfirmPayload = {
  jobId: string;
  toolCallId: string;
  toolName: string;
  description: string;
  arguments: Record<string, unknown>;
};

type AIAssistantToolActivityPayload = {
  jobId: string;
  toolName: string;
  status: 'started' | 'finished';
};

export { aiAssistantEvents };
export type {
  AIAssistantErrorPayload,
  AIAssistantProgressPayload,
  AIAssistantReplyPayload,
  AIAssistantToolActivityPayload,
  AIAssistantToolConfirmPayload,
};
