import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { IconButton } from './IconButton.js';

type QuerySearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearAriaLabel: string;
  tipsAriaLabel: string;
  inlineSlot?: ReactNode;
  rightSlot?: ReactNode;
  tipsContent?: ReactNode;
  className?: string;
};

const QuerySearchBar = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearAriaLabel,
  tipsAriaLabel,
  inlineSlot,
  rightSlot,
  tipsContent,
  className = '',
}: QuerySearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    if (!hintOpen) return undefined;
    const onClick = (event: MouseEvent) => {
      if (!hintRef.current?.contains(event.target as Node)) setHintOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [hintOpen]);

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`flex items-center gap-1.5 pb-2 pt-0.5 ${className}`.trim()}>
      <div
        className="flex min-h-8 min-w-0 flex-1 cursor-text flex-wrap items-center gap-1 rounded-md border border-border bg-warm py-1 pl-2 pr-2 transition-all focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/20"
        onClick={() => inputRef.current?.focus()}
      >
        {inlineSlot}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="h-6 min-w-[100px] flex-1 bg-transparent text-xs font-medium placeholder:text-ink-muted focus:outline-none"
        />
        {value && (
          <IconButton variant="clear" aria-label={clearAriaLabel} onClick={clear}>
            <XMarkIcon className="h-3 w-3" />
          </IconButton>
        )}
        {tipsContent && (
          <div ref={hintRef} className="relative shrink-0">
            <IconButton
              variant="subtle"
              aria-label={tipsAriaLabel}
              ariaExpanded={hintOpen}
              onClick={event => {
                event.stopPropagation();
                setHintOpen(open => !open);
              }}
            >
              {value ? (
                <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
              ) : (
                <MagnifyingGlassIcon className="h-3.5 w-3.5" />
              )}
            </IconButton>
            {hintOpen && (
              <div
                role="dialog"
                aria-label={tipsAriaLabel}
                className="absolute right-0 top-full z-40 mt-1 w-64 rounded-md border border-border bg-paper p-3 text-[11px] leading-snug shadow-lg"
              >
                {tipsContent}
              </div>
            )}
          </div>
        )}
      </div>
      {rightSlot}
    </div>
  );
};

export type { QuerySearchBarProps };
export { QuerySearchBar };
