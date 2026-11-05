import { useEffect } from 'react';
import { socket } from '#app/socket.js';
import {
  aiAssistantEvents,
  type AIAssistantErrorPayload,
  type AIAssistantProgressPayload,
  type AIAssistantReplyPayload,
  type AIAssistantToolActivityPayload,
  type AIAssistantToolConfirmPayload,
} from '#V2/api/aiAssistant/events.js';

type UseAIAssistantSocketOptions = {
  enabled?: boolean;
  onReply: (payload: AIAssistantReplyPayload) => void;
  onError: (payload: AIAssistantErrorPayload) => void;
  onProgress?: (payload: AIAssistantProgressPayload) => void;
  onToolConfirm?: (payload: AIAssistantToolConfirmPayload) => void;
  onToolActivity?: (payload: AIAssistantToolActivityPayload) => void;
};

type SocketHandlers = {
  [aiAssistantEvents.reply]: (payload: AIAssistantReplyPayload) => void;
  [aiAssistantEvents.error]: (payload: AIAssistantErrorPayload) => void;
  [aiAssistantEvents.progress]: (payload: AIAssistantProgressPayload) => void;
  [aiAssistantEvents.toolConfirm]: (payload: AIAssistantToolConfirmPayload) => void;
  [aiAssistantEvents.toolActivity]: (payload: AIAssistantToolActivityPayload) => void;
};

const bindSocket = (handlers: SocketHandlers) => {
  (
    Object.entries(handlers) as Array<[keyof SocketHandlers, SocketHandlers[keyof SocketHandlers]]>
  ).forEach(([event, handler]) => {
    socket.on(event, handler);
  });

  return () => {
    (
      Object.entries(handlers) as Array<
        [keyof SocketHandlers, SocketHandlers[keyof SocketHandlers]]
      >
    ).forEach(([event, handler]) => {
      socket.off(event, handler);
    });
  };
};

const useAIAssistantSocket = ({
  enabled = true,
  onReply,
  onError,
  onProgress,
  onToolConfirm,
  onToolActivity,
}: UseAIAssistantSocketOptions) => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return bindSocket({
      [aiAssistantEvents.reply]: onReply,
      [aiAssistantEvents.error]: onError,
      [aiAssistantEvents.progress]: payload => onProgress?.(payload),
      [aiAssistantEvents.toolConfirm]: payload => onToolConfirm?.(payload),
      [aiAssistantEvents.toolActivity]: payload => onToolActivity?.(payload),
    });
  }, [enabled, onError, onProgress, onReply, onToolActivity, onToolConfirm]);
};

export { useAIAssistantSocket };
export type { UseAIAssistantSocketOptions };
