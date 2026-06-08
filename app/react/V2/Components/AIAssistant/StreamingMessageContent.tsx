import React, { useEffect, useRef } from 'react';
import type { ChatMessageContent } from './types.js';

const STREAM_CHARS_PER_TICK = 2;
const STREAM_TICK_MS = 18;

type StreamingMessageContentProps = {
  content: ChatMessageContent[];
  onComplete: () => void;
  onProgress?: () => void;
};

const CodeBlockView = ({
  block,
}: {
  block: Extract<ChatMessageContent, { kind: 'code' }>['block'];
}) => (
  <div className="overflow-hidden rounded-md border border-border bg-vellum">
    <div className="flex items-center justify-between border-b border-border-soft px-3 py-1.5">
      <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-muted">
        {block.language}
      </span>
    </div>
    <pre className="overflow-x-auto px-3 py-2 text-xs leading-relaxed text-ink">
      <code>{block.code}</code>
    </pre>
  </div>
);

const StaticPart = ({ part }: { part: ChatMessageContent }) => {
  if (part.kind === 'text') {
    return <p>{part.text}</p>;
  }

  if (part.kind === 'list') {
    return (
      <ol className="list-decimal space-y-2 pl-5">
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

  return <CodeBlockView block={part.block} />;
};

const StreamingMessageContent = ({
  content,
  onComplete,
  onProgress,
}: StreamingMessageContentProps) => {
  const [partIndex, setPartIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (partIndex >= content.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    const part = content[partIndex];

    if (part.kind !== 'text') {
      setPartIndex(current => current + 1);
      setCharIndex(0);
      onProgress?.();
      return;
    }

    if (charIndex >= part.text.length) {
      setPartIndex(current => current + 1);
      setCharIndex(0);
      onProgress?.();
      return;
    }

    const timer = window.setTimeout(() => {
      setCharIndex(current => Math.min(current + STREAM_CHARS_PER_TICK, part.text.length));
      onProgress?.();
    }, STREAM_TICK_MS);

    return () => window.clearTimeout(timer);
  }, [partIndex, charIndex, content, onComplete, onProgress]);

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
      {content.map((part, index) => {
        if (index < partIndex) {
          return <StaticPart key={`part-${index}`} part={part} />;
        }

        if (index !== partIndex) return null;

        if (part.kind === 'text') {
          return <p key={`part-${index}`}>{part.text.slice(0, charIndex)}</p>;
        }

        return null;
      })}
    </div>
  );
};

export { StreamingMessageContent };
