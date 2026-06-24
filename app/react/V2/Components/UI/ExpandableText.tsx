import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';

type ExpandableTextProps = {
  text: string;
  minLength?: number;
  quoted?: boolean;
  textClassName?: string;
  className?: string;
  fadeClassName?: string;
  buttonClassName?: string;
};

const ExpandableText = ({
  text,
  minLength = 180,
  quoted = false,
  textClassName = '',
  className = '',
  fadeClassName = 'from-warm/95',
  buttonClassName = '',
}: ExpandableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const expandable = text.length > minLength;

  return (
    <div className={`relative min-w-0 ${className}`}>
      <p className={`${expanded ? '' : 'line-clamp-2'} ${textClassName}`}>
        {quoted ? `\u201c${text}\u201d` : text}
      </p>
      {expandable && !expanded && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-linear-to-t ${fadeClassName} to-transparent`}
        />
      )}
      {expandable && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            setExpanded(current => !current);
          }}
          className={`relative mt-0.5 text-[10px] font-medium text-ink-tertiary hover:text-ink-secondary ${buttonClassName}`}
        >
          {expanded ? <Translate>Show less</Translate> : <Translate>Show more</Translate>}
        </button>
      )}
    </div>
  );
};

export { ExpandableText };
export type { ExpandableTextProps };
