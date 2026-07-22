import React, { useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

type CompactSearchInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
};

const CompactSearchInput = ({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  autoFocus = false,
  className = '',
}: CompactSearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`relative shrink-0 border-b border-border ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.currentTarget.value)}
        className="h-8 min-h-8 w-full min-w-0 flex-1 rounded-none border-0 bg-transparent pl-3 pr-8 text-xs font-medium text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
    </div>
  );
};

export { CompactSearchInput };
export type { CompactSearchInputProps };
