import React, { FormEvent } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

const ChatInput = ({ value, onChange, onSubmit, disabled = false }: ChatInputProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!value.trim() || disabled) return;
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 bg-warm border border-border-soft rounded-xl pl-3.5 pr-2 py-2 focus-within:ring-2 focus-within:ring-carbon/20 focus-within:border-carbon/30 transition-shadow">
        <input
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask Bert anything, or describe a task…"
          className="min-w-0 flex-1 border-0 bg-warm text-sm text-ink placeholder:text-ink-muted focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0 bg-vellum"
          aria-label="Send message"
        >
          <ArrowUpIcon className="h-4 w-4 shrink-0 text-ink" />
        </button>
      </div>
    </form>
  );
};

export { ChatInput };
export type { ChatInputProps };
