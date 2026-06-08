import { useEffect } from 'react';
import { socket } from '#app/socket.js';
import {
  aiAssistantEvents,
  type AIAssistantErrorPayload,
  type AIAssistantReplyPayload,
} from '#V2/api/aiAssistant/events.js';

type UseAIAssistantSocketOptions = {
  enabled?: boolean;
  onReply: (payload: AIAssistantReplyPayload) => void;
  onError: (payload: AIAssistantErrorPayload) => void;
};

const useAIAssistantSocket = ({
  enabled = true,
  onReply,
  onError,
}: UseAIAssistantSocketOptions) => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleReply = (payload: AIAssistantReplyPayload) => {
      onReply(payload);
    };

    const handleError = (payload: AIAssistantErrorPayload) => {
      onError(payload);
    };

    socket.on(aiAssistantEvents.reply, handleReply);
    socket.on(aiAssistantEvents.error, handleError);

    return () => {
      socket.off(aiAssistantEvents.reply, handleReply);
      socket.off(aiAssistantEvents.error, handleError);
    };
  }, [enabled, onError, onReply]);
};

export { useAIAssistantSocket };
export type { UseAIAssistantSocketOptions };
