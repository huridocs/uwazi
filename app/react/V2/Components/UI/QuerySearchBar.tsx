import React, { useRef, useState, type ReactNode } from 'react';
import {
  LightBulbIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AnchoredPortal } from './AnchoredPortal.js';
import { IconButton } from './IconButton.js';

type QuerySearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearAriaLabel: string;
  tipsAriaLabel?: string;
  tipsLabel?: ReactNode;
  tipsWidth?: number;
  inlineSlot?: ReactNode;
  rightSlot?: ReactNode;
  tipsContent?: ReactNode;
  className?: string;
  boxClassName?: string;
};

const QuerySearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  clearAriaLabel,
  tipsAriaLabel,
  tipsLabel,
  tipsWidth = 256,
  inlineSlot,
  rightSlot,
  tipsContent,
  className = '',
  boxClassName = 'bg-warm',
}: QuerySearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || 'pb-1 pt-0.5'}`.trim()}>
      <div
        className={[
          'flex min-h-8 min-w-48 flex-1 cursor-text flex-wrap items-center gap-1.5 rounded-md',
          'border border-border py-0.5 pl-2 pr-2 transition-all',
          'focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/20',
          boxClassName,
        ].join(' ')}
        onClick={() => inputRef.current?.focus()}
      >
        <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
        {inlineSlot}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key !== 'Enter') {
              return;
            }
            event.preventDefault();
            onSubmit?.(event.currentTarget.value);
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="h-6 min-w-25 flex-1 bg-transparent text-xs font-medium placeholder:text-ink-muted focus:outline-none"
        />
        {value && (
          <IconButton variant="clear" aria-label={clearAriaLabel} onClick={clear}>
            <XMarkIcon className="h-3 w-3" />
          </IconButton>
        )}
        {tipsContent && tipsAriaLabel && (
          <div ref={hintRef} className="relative shrink-0">
            {tipsLabel ? (
              <button
                type="button"
                aria-label={tipsAriaLabel}
                aria-expanded={hintOpen}
                onClick={event => {
                  event.stopPropagation();
                  setHintOpen(open => !open);
                }}
                className="inline-flex h-5 shrink-0 cursor-pointer items-center gap-1 rounded bg-warm px-1.5 text-nano font-medium text-ink-tertiary transition-colors hover:bg-parchment hover:text-ink-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-ink/20"
              >
                <LightBulbIcon className="h-2.5 w-2.5" aria-hidden />
                {tipsLabel}
              </button>
            ) : (
              <IconButton
                variant="subtle"
                aria-label={tipsAriaLabel}
                ariaExpanded={hintOpen}
                onClick={event => {
                  event.stopPropagation();
                  setHintOpen(open => !open);
                }}
              >
                <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
              </IconButton>
            )}
            <AnchoredPortal
              open={hintOpen}
              anchorRef={hintRef}
              prefer="end"
              width={tipsWidth}
              onClose={() => setHintOpen(false)}
              className="rounded-md border border-border bg-paper p-3 text-micro leading-snug shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
            >
              <div role="dialog" aria-label={tipsAriaLabel}>
                {tipsContent}
              </div>
            </AnchoredPortal>
          </div>
        )}
      </div>
      {rightSlot}
    </div>
  );
};

export type { QuerySearchBarProps };
export { QuerySearchBar };
