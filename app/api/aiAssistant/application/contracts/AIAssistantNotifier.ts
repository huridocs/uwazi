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

interface AIAssistantNotifier {
  reply(payload: AIAssistantReplyPayload): void;
  progress(payload: AIAssistantProgressPayload): void;
  error(payload: AIAssistantErrorPayload): void;
  toolConfirm(payload: AIAssistantToolConfirmPayload): void;
  toolActivity(payload: AIAssistantToolActivityPayload): void;
}

export type {
  AIAssistantErrorPayload,
  AIAssistantNotifier,
  AIAssistantProgressPayload,
  AIAssistantReplyPayload,
  AIAssistantToolActivityPayload,
  AIAssistantToolConfirmPayload,
};
