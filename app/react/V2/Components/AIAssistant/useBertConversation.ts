import { useCallback, useRef, useState } from 'react';
import { cancelConversation as cancelAIAssistantConversation } from '#V2/api/aiAssistant/conversation.js';
import { sendMessage as sendAIAssistantMessage } from '#V2/api/aiAssistant/messages.js';
import {
  getBertSessionPassword,
  hasBertSessionPassword,
  setBertSessionPassword,
} from './bertSessionPassword.js';
import { createId, formatTime } from './bertChatUtils.js';
import { useAIAssistantSocket } from './useAIAssistantSocket.js';
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
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map(message => ({ ...message }))
  );
  const [draftMessage, setDraftMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [jobProgress, setJobProgress] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(
    () => mockReplies || hasBertSessionPassword()
  );

  const passwordRef = useRef<string | null>(getBertSessionPassword());
  const conversationJobIdRef = useRef<string | null>(null);
  const pendingJobIdRef = useRef<string | null>(null);
  const isThinkingRef = useRef(false);

  const { sendMockReply } = useMockBertReplies({ replyScenario });

  const isReplying = isThinking || streamingMessageId !== null;
  const needsPasswordUnlock = !mockReplies && !isPasswordUnlocked;

  const matchesActiveJob = useCallback((jobId: string) => {
    const activeJobId = pendingJobIdRef.current;
    if (!activeJobId) {
      return false;
    }

    return String(jobId) === String(activeJobId);
  }, []);

  const unlockWithPassword = useCallback((password: string) => {
    passwordRef.current = password;
    setBertSessionPassword(password);
    setIsPasswordUnlocked(true);
  }, []);

  const handleAssistantReply = useCallback(
    (payload: { jobId: string; message: string }) => {
      if (!matchesActiveJob(payload.jobId)) {
        return;
      }

      const reply: ChatMessage = {
        id: createId(),
        role: 'assistant',
        timestamp: formatTime(),
        text: payload.message,
      };

      conversationJobIdRef.current = String(payload.jobId);
      pendingJobIdRef.current = null;
      isThinkingRef.current = false;
      setMessages(current => [...current, reply]);
      setIsThinking(false);
      setJobProgress(null);
      setStreamingMessageId(reply.id);
    },
    [matchesActiveJob]
  );

  const handleAssistantProgress = useCallback(
    (payload: { jobId: string; progress: string }) => {
      if (!matchesActiveJob(payload.jobId)) {
        return;
      }

      setJobProgress(payload.progress);
    },
    [matchesActiveJob]
  );

  const handleAssistantError = useCallback(
    (payload: { jobId: string; error: string }) => {
      if (!matchesActiveJob(payload.jobId)) {
        return;
      }

      pendingJobIdRef.current = null;
      isThinkingRef.current = false;
      setReplyError(payload.error || 'Bert could not complete your request. Try again.');
      setIsThinking(false);
      setJobProgress(null);
    },
    [matchesActiveJob]
  );

  useAIAssistantSocket({
    enabled: open && !mockReplies && isPasswordUnlocked,
    onReply: handleAssistantReply,
    onError: handleAssistantError,
    onProgress: handleAssistantProgress,
  });

  const sendMessage = useCallback(async () => {
    const text = draftMessage.trim();
    if (!text || isReplying) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      timestamp: formatTime(),
      text,
    };

    setMessages(current => [...current, userMessage]);
    setDraftMessage('');
    setReplyError(null);
    isThinkingRef.current = true;
    setIsThinking(true);
    setJobProgress(null);
    setStreamingMessageId(null);

    if (mockReplies) {
      sendMockReply(
        text,
        contextChips,
        reply => {
          setMessages(current => [...current, reply]);
          setStreamingMessageId(reply.id);
        },
        error => setReplyError(error),
        () => {
          isThinkingRef.current = false;
          setIsThinking(false);
        }
      );
      return;
    }

    const password = passwordRef.current;
    if (!password) {
      setReplyError('Enter your Uwazi password to send messages.');
      isThinkingRef.current = false;
      setIsThinking(false);
      return;
    }

    const [response, error] = await sendAIAssistantMessage({
      message: text,
      password,
      jobId: conversationJobIdRef.current ?? undefined,
    });

    if (error || !response?.jobId) {
      setReplyError(
        error?.json?.prettyMessage ||
          'Bert could not complete your request. Check your connection and try again.'
      );
      isThinkingRef.current = false;
      setIsThinking(false);
      return;
    }

    const jobId = String(response.jobId);
    conversationJobIdRef.current = jobId;
    pendingJobIdRef.current = jobId;
  }, [contextChips, draftMessage, isReplying, mockReplies, sendMockReply]);

  const clearChat = useCallback(async () => {
    const jobId = conversationJobIdRef.current;
    const password = passwordRef.current;

    conversationJobIdRef.current = null;
    pendingJobIdRef.current = null;
    isThinkingRef.current = false;
    setMessages([]);
    setDraftMessage('');
    setReplyError(null);
    setIsThinking(false);
    setJobProgress(null);
    setStreamingMessageId(null);

    if (!mockReplies && jobId && password) {
      await cancelAIAssistantConversation({ jobId, password });
    }
  }, [mockReplies]);

  const finishStreaming = useCallback(() => {
    setStreamingMessageId(null);
  }, []);

  return {
    messages,
    draftMessage,
    isReplying,
    isThinking,
    jobProgress,
    streamingMessageId,
    replyError,
    needsPasswordUnlock,
    setDraftMessage,
    unlockWithPassword,
    sendMessage,
    finishStreaming,
    clearChat,
  };
};

export { useBertConversation };
export type { UseBertConversationOptions };
