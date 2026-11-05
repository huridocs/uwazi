import type {
  AIAssistantErrorPayload,
  AIAssistantProgressPayload,
  AIAssistantReplyPayload,
  AIAssistantToolActivityPayload,
  AIAssistantToolConfirmPayload,
} from '#V2/api/aiAssistant/events.js';
import { createId, formatTime } from './bertChatUtils.js';
import type { BertJobRefs } from './useBertChatState.js';
import type { ChatMessage } from './types.js';

type ChatSetters = {
  setMessages: (update: (current: ChatMessage[]) => ChatMessage[]) => void;
  setPendingConfirm: (value: AIAssistantToolConfirmPayload | null) => void;
  setToolActivity: (value: string | null) => void;
  setIsThinking: (value: boolean) => void;
  setJobProgress: (value: string | null) => void;
  setStreamingMessageId: (value: string | null) => void;
  setReplyError: (value: string | null) => void;
};

const matchesJob = (jobRefs: BertJobRefs, jobId: string) => {
  if (!jobRefs.conversationJobId) {
    return false;
  }
  return String(jobId) === String(jobRefs.conversationJobId);
};

const stopThinking = (jobRefs: { current: BertJobRefs }, setters: ChatSetters) => {
  jobRefs.current.pendingJobId = null;
  jobRefs.current.isThinking = false;
  setters.setPendingConfirm(null);
  setters.setToolActivity(null);
  setters.setIsThinking(false);
  setters.setJobProgress(null);
};

const onAssistantReply = (
  jobRefs: { current: BertJobRefs },
  setters: ChatSetters,
  payload: AIAssistantReplyPayload
) => {
  if (!matchesJob(jobRefs.current, payload.jobId)) {
    return;
  }

  const reply: ChatMessage = {
    id: createId(),
    role: 'assistant',
    timestamp: formatTime(),
    text: payload.message,
  };

  jobRefs.current.conversationJobId = String(payload.jobId);
  stopThinking(jobRefs, setters);
  setters.setMessages(current => [...current, reply]);
  setters.setStreamingMessageId(reply.id);
};

const onAssistantProgress = (
  jobRefs: { current: BertJobRefs },
  setters: ChatSetters,
  payload: AIAssistantProgressPayload
) => {
  if (!matchesJob(jobRefs.current, payload.jobId)) {
    return;
  }
  setters.setJobProgress(payload.progress);
};

const onAssistantError = (
  jobRefs: { current: BertJobRefs },
  setters: ChatSetters,
  payload: AIAssistantErrorPayload
) => {
  if (!matchesJob(jobRefs.current, payload.jobId)) {
    return;
  }

  stopThinking(jobRefs, setters);
  setters.setReplyError(payload.error || 'Bert could not complete your request. Try again.');
};

const onToolConfirm = (
  jobRefs: { current: BertJobRefs },
  setters: ChatSetters,
  payload: AIAssistantToolConfirmPayload
) => {
  if (!matchesJob(jobRefs.current, payload.jobId)) {
    return;
  }
  setters.setPendingConfirm(payload);
  setters.setIsThinking(false);
  setters.setJobProgress(null);
};

const onToolActivity = (
  jobRefs: { current: BertJobRefs },
  setters: ChatSetters,
  payload: AIAssistantToolActivityPayload
) => {
  if (!matchesJob(jobRefs.current, payload.jobId)) {
    return;
  }
  setters.setToolActivity(payload.status === 'started' ? payload.toolName : null);
};

export { onAssistantError, onAssistantProgress, onAssistantReply, onToolActivity, onToolConfirm };
export type { ChatSetters };
