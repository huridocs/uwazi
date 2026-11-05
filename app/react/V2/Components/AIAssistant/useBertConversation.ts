import { useMemo } from 'react';
import type { ChatSetters } from './bertSocketHandlers.js';
import { useBertChatState } from './useBertChatState.js';
import { useBertConversationActions } from './useBertConversationActions.js';
import { useBertLiveSession } from './useBertLiveSession.js';
import { useBertPasswordSettings } from './useBertPasswordSettings.js';
import { useMockBertReplies } from './useMockBertReplies.js';
import type { ReplyScenario } from './useMockBertReplies.js';
import type { ChatMessage, ContextChip } from './types.js';

type UseBertConversationOptions = {
  open: boolean;
  mockReplies?: boolean;
  replyScenario?: ReplyScenario;
  initialMessages?: ChatMessage[];
  /** Used by mock replies only; the context bar is UI-only until wired to the API. */
  contextChips: ContextChip[];
};

const useBertConversation = ({
  open,
  mockReplies = false,
  replyScenario = 'normal',
  initialMessages = [],
  contextChips,
}: UseBertConversationOptions) => {
  const chat = useBertChatState(initialMessages);
  const password = useBertPasswordSettings(mockReplies);
  const { sendMockReply } = useMockBertReplies({ replyScenario });
  const setters: ChatSetters & { setDraftMessage: (value: string) => void } = useMemo(
    () => ({
      setMessages: chat.setMessages,
      setPendingConfirm: chat.setPendingConfirm,
      setToolActivity: chat.setToolActivity,
      setIsThinking: chat.setIsThinking,
      setJobProgress: chat.setJobProgress,
      setStreamingMessageId: chat.setStreamingMessageId,
      setReplyError: chat.setReplyError,
      setDraftMessage: chat.setDraftMessage,
    }),
    [
      chat.setDraftMessage,
      chat.setIsThinking,
      chat.setJobProgress,
      chat.setMessages,
      chat.setPendingConfirm,
      chat.setReplyError,
      chat.setStreamingMessageId,
      chat.setToolActivity,
    ]
  );

  const isReplying =
    chat.isThinking || chat.streamingMessageId !== null || chat.pendingConfirm !== null;
  const needsPasswordUnlock =
    !mockReplies && password.requiresPassword && !password.isPasswordUnlocked;

  useBertLiveSession({
    enabled: open && !mockReplies && password.isPasswordUnlocked,
    jobRefs: chat.jobRefs,
    setters,
  });

  const actions = useBertConversationActions({
    draftMessage: chat.draftMessage,
    isReplying,
    mockReplies,
    requiresPassword: password.requiresPassword,
    passwordRef: password.passwordRef,
    conversationJobId: chat.jobRefs.current.conversationJobId,
    pendingConfirm: chat.pendingConfirm,
    contextChips,
    sendMockReply,
    setters,
    jobRefs: chat.jobRefs,
    setStreamingMessageId: chat.setStreamingMessageId,
  });

  return {
    messages: chat.messages,
    draftMessage: chat.draftMessage,
    isReplying,
    isThinking: chat.isThinking,
    jobProgress: chat.jobProgress,
    streamingMessageId: chat.streamingMessageId,
    replyError: chat.replyError,
    needsPasswordUnlock,
    pendingConfirm: chat.pendingConfirm,
    toolActivity: chat.toolActivity,
    setDraftMessage: chat.setDraftMessage,
    unlockWithPassword: password.unlockWithPassword,
    ...actions,
  };
};

export { useBertConversation };
export type { UseBertConversationOptions };
