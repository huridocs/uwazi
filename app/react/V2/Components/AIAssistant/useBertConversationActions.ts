import { useCallback } from 'react';
import type { ConfirmDecision } from '#V2/api/aiAssistant/confirm.js';
import type { ChatSetters } from './bertSocketHandlers.js';
import { clearBertChat, respondToBertConfirm, sendBertMessage } from './bertConversationActions.js';
import type { BertJobRefs } from './useBertChatState.js';
import type { ContextChip } from './types.js';
import type { SendMockReply } from './bertConversationActions.js';

type ActionSetters = ChatSetters & { setDraftMessage: (value: string) => void };

const useBertConversationActions = (input: {
  draftMessage: string;
  isReplying: boolean;
  mockReplies: boolean;
  requiresPassword: boolean;
  passwordRef: { current: string | null };
  conversationJobId: string | null;
  pendingConfirm: { jobId: string; toolCallId: string } | null;
  contextChips: ContextChip[];
  sendMockReply: SendMockReply;
  setters: ActionSetters;
  jobRefs: { current: BertJobRefs };
  setStreamingMessageId: (value: string | null) => void;
}) => {
  const sendMessage = useCallback(async () => {
    const text = input.draftMessage.trim();
    if (!text || input.isReplying) {
      return;
    }
    await sendBertMessage({
      text,
      mockReplies: input.mockReplies,
      requiresPassword: input.requiresPassword,
      password: input.passwordRef.current,
      conversationJobId: input.conversationJobId,
      contextChips: input.contextChips,
      sendMockReply: input.sendMockReply,
      setters: input.setters,
      jobRefs: input.jobRefs,
    });
  }, [input]);

  const respondToConfirm = useCallback(
    async (decision: ConfirmDecision) => {
      await respondToBertConfirm({
        pendingConfirm: input.pendingConfirm,
        decision,
        setters: input.setters,
        jobRefs: input.jobRefs,
      });
    },
    [input]
  );

  const clearChat = useCallback(async () => {
    await clearBertChat({
      mockReplies: input.mockReplies,
      setters: input.setters,
      jobRefs: input.jobRefs,
    });
  }, [input]);

  const finishStreaming = useCallback(() => {
    input.setStreamingMessageId(null);
  }, [input]);

  return { sendMessage, respondToConfirm, clearChat, finishStreaming };
};

export { useBertConversationActions };
