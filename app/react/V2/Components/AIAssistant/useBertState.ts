import { useCallback, useMemo, useRef, useState } from 'react';
import { cancelConversation as cancelAIAssistantConversation } from '#V2/api/aiAssistant/conversation.js';
import { sendMessage as sendAIAssistantMessage } from '#V2/api/aiAssistant/messages.js';
import {
  buildContextSummary,
  CONTEXT_ADD_LABELS,
  DEFAULT_BERT_MESSAGES,
  DEFAULT_CONTEXT_CHIPS,
} from './mockBertData.js';
import { useAIAssistantSocket } from './useAIAssistantSocket.js';
import {
  getBertSessionPassword,
  hasBertSessionPassword,
  setBertSessionPassword,
} from './bertSessionPassword.js';
import type {
  ChatMessage,
  ContextAddOptionId,
  ContextChip,
  ContextScopeMode,
} from './types.js';

type ReplyScenario = 'normal' | 'slow' | 'error';

const REPLY_DELAYS_MS: Record<ReplyScenario, number> = {
  normal: 900,
  slow: 4000,
  error: 1200,
};

type UseBertStateOptions = {
  initialMessages?: ChatMessage[];
  initialContextChips?: ContextChip[];
  mockReplies?: boolean;
  replyScenario?: ReplyScenario;
};

const createId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatTime = () =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());

const buildGroundedReply = (prompt: string, chips: ContextChip[]): ChatMessage => {
  const scope = buildContextSummary(chips);
  const promptSnippet = prompt.trim()
    ? ` Regarding **"${prompt.trim().slice(0, 80)}${prompt.trim().length > 80 ? '…' : ''}"** — I can walk through the relevant passages next.`
    : '';

  return {
    id: createId(),
    role: 'assistant',
    timestamp: formatTime(),
    text: `Working in context of **${scope}**. I'd ground my answer in the documents in scope and cite the passages as I go, then summarise what I find.${promptSnippet}`,
  };
};

const useBertState = ({
  initialMessages = DEFAULT_BERT_MESSAGES,
  initialContextChips = DEFAULT_CONTEXT_CHIPS,
  mockReplies = false,
  replyScenario = 'normal',
}: UseBertStateOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map(message => ({ ...message }))
  );
  const [contextMode, setContextMode] = useState<ContextScopeMode>('auto');
  const [contextChips, setContextChips] = useState<ContextChip[]>(() =>
    initialContextChips.map(chip => ({ ...chip }))
  );
  const [draftMessage, setDraftMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [jobProgress, setJobProgress] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(
    () => mockReplies || hasBertSessionPassword()
  );
  const passwordRef = useRef<string | null>(getBertSessionPassword());
  const conversationJobIdRef = useRef<string | null>(null);
  const pendingJobIdRef = useRef<string | null>(null);
  const inFlightSendRef = useRef(false);
  const isThinkingRef = useRef(false);

  const isReplying = isThinking || streamingMessageId !== null;
  const needsPasswordUnlock = !mockReplies && !isPasswordUnlocked;

  const contextModeLabel = contextMode === 'auto' ? 'Auto' : 'This document';

  const matchesActiveJob = useCallback((jobId: string) => {
    const normalizedJobId = String(jobId);
    const pendingJobId = pendingJobIdRef.current;

    if (pendingJobId !== null) {
      return normalizedJobId === String(pendingJobId);
    }

    return inFlightSendRef.current || isThinkingRef.current;
  }, []);

  const unlockWithPassword = useCallback((password: string) => {
    passwordRef.current = password;
    setBertSessionPassword(password);
    setIsPasswordUnlocked(true);
  }, []);

  const handleAssistantReply = useCallback(
    (payload: { jobId: string; message: string }) => {
      if (!matchesActiveJob(payload.jobId)) {
        // eslint-disable-next-line no-console
        console.log('[aiAssistant:client] reply.ignored', {
          jobId: payload.jobId,
          pendingJobId: pendingJobIdRef.current,
          inFlightSend: inFlightSendRef.current,
          isThinking: isThinkingRef.current,
        });
        return;
      }

      const reply: ChatMessage = {
        id: createId(),
        role: 'assistant',
        timestamp: formatTime(),
        text: payload.message,
      };

      inFlightSendRef.current = false;
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
        // eslint-disable-next-line no-console
        console.log('[aiAssistant:client] progress.ignored', {
          jobId: payload.jobId,
          pendingJobId: pendingJobIdRef.current,
        });
        return;
      }

      pendingJobIdRef.current = String(payload.jobId);
      setJobProgress(payload.progress);
    },
    [matchesActiveJob]
  );

  const handleAssistantError = useCallback(
    (payload: { jobId: string; error: string }) => {
      if (!matchesActiveJob(payload.jobId)) {
        // eslint-disable-next-line no-console
        console.log('[aiAssistant:client] error.ignored', {
          jobId: payload.jobId,
          pendingJobId: pendingJobIdRef.current,
        });
        return;
      }

      inFlightSendRef.current = false;
      pendingJobIdRef.current = null;
      isThinkingRef.current = false;
      setReplyError(payload.error || 'Bert could not complete your request. Try again.');
      setIsThinking(false);
      setJobProgress(null);
    },
    [matchesActiveJob]
  );

  useAIAssistantSocket({
    enabled: !mockReplies && isPasswordUnlocked,
    onReply: handleAssistantReply,
    onError: handleAssistantError,
    onProgress: handleAssistantProgress,
  });

  const removeContextChip = useCallback((chipId: string) => {
    setContextChips(current => current.filter(chip => chip.id !== chipId));
  }, []);

  const addContextOption = useCallback((optionId: ContextAddOptionId) => {
    const label = CONTEXT_ADD_LABELS[optionId];
    if (!label) return;

    const chipId = `chip-${optionId}`;
    setContextChips(current => {
      if (current.some(chip => chip.id === chipId)) return current;
      const kind =
        optionId === 'entity'
          ? 'entity'
          : optionId === 'file'
            ? 'file'
            : optionId === 'template'
              ? 'template'
              : optionId === 'page'
                ? 'page'
                : 'document';

      return [
        ...current,
        {
          id: chipId,
          label,
          kind,
          removable: true,
        },
      ];
    });
  }, []);

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
      window.setTimeout(() => {
        if (replyScenario === 'error') {
          setReplyError(
            'Bert could not complete your request. Check your connection and try again.'
          );
          isThinkingRef.current = false;
          setIsThinking(false);
          return;
        }

        const reply = buildGroundedReply(text, contextChips);
        setMessages(current => [...current, reply]);
        isThinkingRef.current = false;
        setIsThinking(false);
        setStreamingMessageId(reply.id);
      }, REPLY_DELAYS_MS[replyScenario]);
      return;
    }

    const password = passwordRef.current;
    if (!password) {
      setReplyError('Enter your Uwazi password to send messages.');
      isThinkingRef.current = false;
      setIsThinking(false);
      return;
    }

    inFlightSendRef.current = true;
    pendingJobIdRef.current = null;

    // eslint-disable-next-line no-console
    console.log('[aiAssistant:client] send.start', {
      conversationJobId: conversationJobIdRef.current,
    });

    const [response, error] = await sendAIAssistantMessage({
      message: text,
      password,
      jobId: conversationJobIdRef.current ?? undefined,
      context: {
        mode: contextMode,
        chips: contextChips,
      },
    });

    inFlightSendRef.current = false;

    if (error || !response?.jobId) {
      // eslint-disable-next-line no-console
      console.log('[aiAssistant:client] send.failed', { error, response });
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

    // eslint-disable-next-line no-console
    console.log('[aiAssistant:client] send.accepted', { jobId });
  }, [contextChips, contextMode, draftMessage, isReplying, mockReplies, replyScenario]);

  const finishStreaming = useCallback(() => {
    setStreamingMessageId(null);
  }, []);

  const clearChat = useCallback(async () => {
    const jobId = conversationJobIdRef.current;
    const password = passwordRef.current;

    conversationJobIdRef.current = null;
    pendingJobIdRef.current = null;
    inFlightSendRef.current = false;
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

  const contextSummary = useMemo(() => buildContextSummary(contextChips), [contextChips]);

  return {
    messages,
    contextMode,
    contextModeLabel,
    contextChips,
    contextSummary,
    draftMessage,
    isReplying,
    isThinking,
    jobProgress,
    streamingMessageId,
    replyError,
    needsPasswordUnlock,
    setContextMode,
    setDraftMessage,
    removeContextChip,
    addContextOption,
    unlockWithPassword,
    sendMessage,
    finishStreaming,
    clearChat,
  };
};

export { useBertState, REPLY_DELAYS_MS };
export type { ReplyScenario, UseBertStateOptions };
