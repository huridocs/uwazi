import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type WarmSelectOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  accessory?: React.ReactNode;
};

type WarmSelectProps<T extends string = string> = {
  value: T;
  options: WarmSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  align?: 'start' | 'end';
  disabled?: boolean;
  variant?: 'warm' | 'paper';
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

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);
  const current = options.find(option => option.value === value) ?? options[0];
  const triggerClass =
    'inline-flex h-8 max-w-full cursor-pointer items-center gap-1 rounded-md border border-border bg-paper ps-3 pe-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/35 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div ref={ref} className="relative w-max shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(currentValue => !currentValue)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={triggerClass}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-ink-secondary transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && !disabled && (
        <div
          role="listbox"
          className={`absolute top-full z-30 mt-1 w-max min-w-full rounded-md border border-border bg-paper py-1 shadow-[0_6px_18px_rgba(0,0,0,0.12)] ${
            align === 'end' ? 'end-0' : 'start-0'
          }`}
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
              className={`flex w-max min-w-full cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-1.5 text-start text-xs transition-colors ${
                option.value === value
                  ? 'bg-vellum font-semibold text-ink'
                  : 'text-ink-secondary hover:bg-warm'
              }`}
            >
              <span>{option.label}</span>
              {option.accessory === undefined ? null : (
                <span className="ms-auto shrink-0 text-meta text-ink-tertiary">
                  {option.accessory}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { WarmSelect };
export type { WarmSelectOption, WarmSelectProps };
