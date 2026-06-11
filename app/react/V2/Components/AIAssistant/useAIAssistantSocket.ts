import { useEffect } from 'react';
import { socket } from '#app/socket.js';
import {
  aiAssistantEvents,
  type AIAssistantErrorPayload,
  type AIAssistantProgressPayload,
  type AIAssistantReplyPayload,
} from '#V2/api/aiAssistant/events.js';

type UseAIAssistantSocketOptions = {
  enabled?: boolean;
  onReply: (payload: AIAssistantReplyPayload) => void;
  onError: (payload: AIAssistantErrorPayload) => void;
  onProgress?: (payload: AIAssistantProgressPayload) => void;
};

const useAIAssistantSocket = ({
  enabled = true,
  onReply,
  onError,
  onProgress,
}: UseAIAssistantSocketOptions) => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleReply = (payload: AIAssistantReplyPayload) => {
      // eslint-disable-next-line no-console
      console.log('[aiAssistant:client] socket.reply', payload);
      onReply(payload);
    };

    const handleError = (payload: AIAssistantErrorPayload) => {
      // eslint-disable-next-line no-console
      console.log('[aiAssistant:client] socket.error', payload);
      onError(payload);
    };

    const handleProgress = (payload: AIAssistantProgressPayload) => {
      // eslint-disable-next-line no-console
      console.log('[aiAssistant:client] socket.progress', payload);
      onProgress?.(payload);
    };

    socket.on(aiAssistantEvents.reply, handleReply);
    socket.on(aiAssistantEvents.error, handleError);
    socket.on(aiAssistantEvents.progress, handleProgress);

    return () => {
      socket.off(aiAssistantEvents.reply, handleReply);
      socket.off(aiAssistantEvents.error, handleError);
      socket.off(aiAssistantEvents.progress, handleProgress);
    };
  }, [enabled, onError, onProgress, onReply]);
};

export { useAIAssistantSocket };
export type { UseAIAssistantSocketOptions };
