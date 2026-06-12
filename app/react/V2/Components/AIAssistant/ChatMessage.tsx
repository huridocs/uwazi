import React, { useCallback } from 'react';
import { BertIconStacked } from './BertIcon.js';
import { MarkdownMessageContent } from './MarkdownMessageContent.js';
import { StreamingMessageContent } from './StreamingMessageContent.js';
import type { ChatMessage } from './types.js';

type ChatMessageProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
  onStreamProgress?: () => void;
};

const ChatMessageView = ({
  message,
  isStreaming = false,
  onStreamComplete,
  onStreamProgress,
}: ChatMessageProps) => {
  const isUser = message.role === 'user';

  const handleStreamComplete = useCallback(() => {
    onStreamComplete?.();
  }, [onStreamComplete]);

  if (isUser) {
    return (
      <article className="flex justify-end">
        <p className="max-w-[85%] rounded-lg bg-parchment px-3 py-2 text-sm text-ink">
          {message.text}
        </p>
      </article>
    );
  }

  return (
    <article className="flex gap-2">
      <BertIconStacked className="mt-1" />
      <div className="min-w-0 flex-1 rounded-lg bg-warm px-3 py-2">
        {isStreaming ? (
          <StreamingMessageContent
            text={message.text}
            onComplete={handleStreamComplete}
            onProgress={onStreamProgress}
          />
        ) : (
          <MarkdownMessageContent text={message.text} />
        )}
      </div>
    </article>
  );
};

export { ChatMessageView };
