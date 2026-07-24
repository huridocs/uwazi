import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type WarmSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type WarmSelectProps<T extends string = string> = {
  value: T;
  options: WarmSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  align?: 'start' | 'end';
  disabled?: boolean;
};

const WarmSelect = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  align = 'start',
  disabled = false,
}: WarmSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;

    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(currentOpen => !currentOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-warm ps-2.5 pe-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-ink-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && !disabled && (
        <div
          role="listbox"
          className={`absolute top-full z-30 mt-1 min-w-40 rounded-md border border-border bg-paper py-1 shadow-[0_6px_18px_rgba(0,0,0,0.12)] ${align === 'end' ? 'end-0' : 'start-0'}`}
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center px-3 py-1.5 text-start text-xs transition-colors ${
                option.value === value
                  ? 'bg-vellum font-semibold text-ink'
                  : 'text-ink-secondary hover:bg-warm'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { WarmSelect };
export type { WarmSelectOption, WarmSelectProps };
