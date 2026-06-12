import { useCallback } from 'react';
import { buildContextSummary } from './bertContextUtils.js';
import { createId, formatTime } from './bertChatUtils.js';
import type { ChatMessage, ContextChip } from './types.js';

type ReplyScenario = 'normal' | 'slow' | 'error';

const REPLY_DELAYS_MS: Record<ReplyScenario, number> = {
  normal: 900,
  slow: 4000,
  error: 1200,
};

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

type UseMockBertRepliesOptions = {
  replyScenario?: ReplyScenario;
};

const useMockBertReplies = ({ replyScenario = 'normal' }: UseMockBertRepliesOptions = {}) => {
  const sendMockReply = useCallback(
    (
      text: string,
      contextChips: ContextChip[],
      onReply: (message: ChatMessage) => void,
      onError: (message: string) => void,
      onComplete: () => void
    ) => {
      window.setTimeout(() => {
        if (replyScenario === 'error') {
          onError('Bert could not complete your request. Check your connection and try again.');
          onComplete();
          return;
        }

        onReply(buildGroundedReply(text, contextChips));
        onComplete();
      }, REPLY_DELAYS_MS[replyScenario]);
    },
    [replyScenario]
  );

  return { sendMockReply };
};

export { REPLY_DELAYS_MS, useMockBertReplies };
export type { ReplyScenario };
