import React, { useEffect, useMemo, useRef } from 'react';
import { MarkdownMessageContent } from './MarkdownMessageContent.js';
import { normalizeMarkdown } from './markdownUtils.js';

const STREAM_CHARS_PER_TICK = 4;
const STREAM_TICK_MS = 9;

type StreamingMessageContentProps = {
  text: string;
  onComplete: () => void;
  onProgress?: () => void;
};

const StreamingMessageContent = ({
  text,
  onComplete,
  onProgress,
}: StreamingMessageContentProps) => {
  const [charIndex, setCharIndex] = React.useState(0);
  const completedRef = useRef(false);
  const normalizedText = useMemo(() => normalizeMarkdown(text), [text]);

  useEffect(() => {
    completedRef.current = false;
    setCharIndex(0);
  }, [normalizedText]);

  useEffect(() => {
    if (charIndex >= normalizedText.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setCharIndex(current => Math.min(current + STREAM_CHARS_PER_TICK, normalizedText.length));
      onProgress?.();
    }, STREAM_TICK_MS);

    return () => window.clearTimeout(timer);
  }, [charIndex, normalizedText, onComplete, onProgress]);

  return <MarkdownMessageContent text={normalizedText.slice(0, charIndex)} />;
};

export { StreamingMessageContent };
