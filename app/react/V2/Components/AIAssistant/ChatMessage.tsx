import React, { useCallback, useState } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { BertIcon, BertIconStacked } from './BertIcon.js';
import { StreamingMessageContent } from './StreamingMessageContent.js';
import type { ChatMessage, ChatMessageContent } from './types.js';

type ChatMessageProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
  onStreamProgress?: () => void;
};
const CodeBlockView = ({
  block,
}: {
  block: Extract<ChatMessageContent, { kind: 'code' }>['block'];
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-border bg-vellum">
      <div className="flex items-center justify-between border-b border-border-soft px-3 py-1.5">
        <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-muted">
          {block.language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1 text-xs text-ink-secondary transition-colors hover:text-ink"
        >
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2 text-xs leading-relaxed text-ink">
        <code>{block.code}</code>
      </pre>
    </div>
  );
};

const MessageContent = ({ content }: { content: ChatMessageContent[] }) => (
  <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
    {content.map((part, index) => {
      if (part.kind === 'text') {
        return <p key={`text-${index}`}>{part.text}</p>;
      }

      if (part.kind === 'list') {
        return (
          <ol key={`list-${index}`} className="list-decimal space-y-2 pl-5">
            {part.items.map((item, itemIndex) => (
              <li key={`item-${itemIndex}`}>
                <span className="font-medium">{item.text}</span>
                {item.subItems?.length ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-ink-secondary">
                    {item.subItems.map((subItem, subIndex) => (
                      <li key={`sub-${subIndex}`}>{subItem}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        );
      }

      return <CodeBlockView key={`code-${index}`} block={part.block} />;
    })}
  </div>
);

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
          {message.content[0]?.kind === 'text' ? message.content[0].text : ''}
        </p>
      </article>
    );
  }

  return (
    <article className="flex gap-2">
      <BertIconStacked className="mt-1" />
      <div className="min-w-0 flex-1 bg-warm rounded-lg px-3 py-2">
        {isStreaming ? (
          <StreamingMessageContent
            content={message.content}
            onComplete={handleStreamComplete}
            onProgress={onStreamProgress}
          />
        ) : (
          <MessageContent content={message.content} />
        )}
      </div>
    </article>
  );
};

export { ChatMessageView };
