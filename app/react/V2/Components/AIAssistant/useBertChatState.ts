import { useRef, useState } from 'react';
import type { AIAssistantToolConfirmPayload } from '#V2/api/aiAssistant/events.js';
import type { ChatMessage } from './types.js';

type BertJobRefs = {
  conversationJobId: string | null;
  pendingJobId: string | null;
  isThinking: boolean;
};

const useBertChatState = (initialMessages: ChatMessage[]) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map(message => ({ ...message }))
  );
  const [draftMessage, setDraftMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [jobProgress, setJobProgress] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<AIAssistantToolConfirmPayload | null>(null);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const jobRefs = useRef<BertJobRefs>({
    conversationJobId: null,
    pendingJobId: null,
    isThinking: false,
  });

  return {
    messages,
    setMessages,
    draftMessage,
    setDraftMessage,
    isThinking,
    setIsThinking,
    jobProgress,
    setJobProgress,
    replyError,
    setReplyError,
    streamingMessageId,
    setStreamingMessageId,
    pendingConfirm,
    setPendingConfirm,
    toolActivity,
    setToolActivity,
    jobRefs,
  };
};

export { useBertChatState };
export type { BertJobRefs };
