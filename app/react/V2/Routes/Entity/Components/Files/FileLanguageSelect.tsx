import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { OptionSchema } from '#V2/Components/Forms/index.js';

type FileLanguageSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: OptionSchema[];
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  selectRef?: React.Ref<HTMLSelectElement>;
  compact?: boolean;
};

const FileLanguageSelect = ({
  value,
  onChange,
  options,
  disabled,
  id,
  'aria-label': ariaLabel,
  selectRef,
  compact = false,
}: FileLanguageSelectProps) => (
  <div
    className={
      compact
        ? 'relative inline-flex items-center overflow-hidden rounded border border-border bg-paper focus-within:ring-1 focus-within:ring-carbon/30'
        : 'relative flex w-full min-w-0 items-center overflow-hidden rounded border border-border bg-paper focus-within:ring-1 focus-within:ring-carbon/30'
    }
  >
    <select
      ref={selectRef}
      id={id}
      value={value}
      onChange={event => onChange(event.target.value)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={
        compact
          ? 'cursor-pointer appearance-none bg-transparent py-0.5 pl-2 pr-5 text-tiny font-semibold text-ink-secondary focus:outline-none'
          : 'w-full min-w-0 max-w-full cursor-pointer appearance-none bg-transparent py-0.5 pl-2 pr-6 text-xs font-medium text-ink focus:outline-none'
      }
    >
      {options.map(option => (
        <option key={option.key ?? option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDownIcon
      className={`pointer-events-none absolute h-micro w-micro text-ink-tertiary ${
        compact ? 'right-1' : 'right-1.5'
      }`}
    />
  </div>
);

export { FileLanguageSelect };
