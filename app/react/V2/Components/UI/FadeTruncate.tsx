import React, { useEffect, useRef, useState } from 'react';
import { Translate } from '#app/I18N/index.js';

type FadeTruncateProps = {
  text: string;
  maxLines?: number;
  expandable?: boolean;
  fadeTo?: string;
  quoted?: boolean;
  className?: string;
};

const lineClampClass = (maxLines: number): string => {
  if (maxLines <= 1) return 'line-clamp-1';
  if (maxLines === 2) return 'line-clamp-2';
  if (maxLines === 3) return 'line-clamp-3';
  if (maxLines === 4) return 'line-clamp-4';
  if (maxLines === 5) return 'line-clamp-5';
  return 'line-clamp-6';
};

const FadeTruncate = ({
  text,
  maxLines = 2,
  expandable = false,
  fadeTo = 'var(--bg-surface)',
  quoted = false,
  className = 'text-xs text-ink-secondary leading-relaxed',
}: FadeTruncateProps) => {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el || expanded) {
      return undefined;
    }

    const measure = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, maxLines, expanded, className]);

  const displayText = quoted ? `\u201c${text}\u201d` : text;
  const showFade = isTruncated && !expanded;

  return (
    <div className="relative min-w-0">
      <p
        ref={textRef}
        className={`overflow-hidden transition-[max-height] duration-200 ease-out ${expanded ? '' : lineClampClass(maxLines)} ${className}`}
      >
        {displayText}
      </p>
      {showFade && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: 20,
            background: `linear-gradient(to bottom, transparent, ${fadeTo})`,
          }}
        />
      )}
      {expandable && isTruncated && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            setExpanded(current => !current);
          }}
          className="mt-0.5 text-[10px] font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          {expanded ? <Translate>Show less</Translate> : <Translate>Show more</Translate>}
        </button>
      )}
    </div>
  );
};

export { FadeTruncate };
export type { FadeTruncateProps };
