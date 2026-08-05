import React, { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type DropdownListboxOption<T extends string> = {
  id: T;
  label: ReactNode;
};

type DropdownListboxProps<T extends string> = {
  prefix: ReactNode;
  value: T;
  options: DropdownListboxOption<T>[];
  onChange: (id: T) => void;
  listAriaLabel: string;
  disabled?: boolean;
  minWidthClass?: string;
};

const DropdownListbox = <T extends string>({
  prefix,
  value,
  options,
  onChange,
  listAriaLabel,
  disabled = false,
  minWidthClass = 'min-w-[120px]',
}: DropdownListboxProps<T>) => {
  const [open, setOpen] = useState(false);
  const active = options.find(option => option.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(current => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={`flex h-6 items-center gap-1 rounded-md border border-border bg-warm px-2 text-micro font-medium transition-colors ${
          disabled
            ? 'cursor-not-allowed text-ink-muted opacity-60'
            : 'cursor-pointer text-ink-secondary hover:bg-parchment hover:text-ink'
        }`}
      >
        <span className="text-ink-tertiary">{prefix}</span>
        <span>{active?.label}</span>
        <ChevronDownIcon className="h-2.5 w-2.5 text-ink-muted" aria-hidden />
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label={listAriaLabel}
            className={`absolute left-0 top-full z-20 mt-1 ${minWidthClass} overflow-hidden rounded-md border border-border bg-paper shadow-lg`}
          >
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={value === option.id}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  value === option.id ? 'bg-vellum text-ink' : 'text-ink-secondary hover:bg-warm'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export type { DropdownListboxOption };
export { DropdownListbox };
