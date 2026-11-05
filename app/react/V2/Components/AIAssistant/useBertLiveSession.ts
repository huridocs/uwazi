import { useCallback } from 'react';
import type {
  AIAssistantErrorPayload,
  AIAssistantProgressPayload,
  AIAssistantReplyPayload,
  AIAssistantToolActivityPayload,
  AIAssistantToolConfirmPayload,
} from '#V2/api/aiAssistant/events.js';
import {
  onAssistantError,
  onAssistantProgress,
  onAssistantReply,
  onToolActivity,
  onToolConfirm,
  type ChatSetters,
} from './bertSocketHandlers.js';
import { useAIAssistantSocket } from './useAIAssistantSocket.js';
import type { BertJobRefs } from './useBertChatState.js';

const useBertLiveSession = (input: {
  enabled: boolean;
  jobRefs: { current: BertJobRefs };
  setters: ChatSetters;
}) => {
  const handleReply = useCallback(
    (payload: AIAssistantReplyPayload) => onAssistantReply(input.jobRefs, input.setters, payload),
    [input.jobRefs, input.setters]
  );
  const handleError = useCallback(
    (payload: AIAssistantErrorPayload) => onAssistantError(input.jobRefs, input.setters, payload),
    [input.jobRefs, input.setters]
  );
  const handleProgress = useCallback(
    (payload: AIAssistantProgressPayload) =>
      onAssistantProgress(input.jobRefs, input.setters, payload),
    [input.jobRefs, input.setters]
  );
  const handleToolConfirm = useCallback(
    (payload: AIAssistantToolConfirmPayload) =>
      onToolConfirm(input.jobRefs, input.setters, payload),
    [input.jobRefs, input.setters]
  );
  const handleToolActivity = useCallback(
    (payload: AIAssistantToolActivityPayload) =>
      onToolActivity(input.jobRefs, input.setters, payload),
    [input.jobRefs, input.setters]
  );

  useAIAssistantSocket({
    enabled: input.enabled,
    onReply: handleReply,
    onError: handleError,
    onProgress: handleProgress,
    onToolConfirm: handleToolConfirm,
    onToolActivity: handleToolActivity,
  });
};

export { useBertLiveSession };
