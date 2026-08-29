import React, { useId, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { useLanguageSelectListbox } from './useLanguageSelectListbox.js';

type LanguageSelectOption<T extends string = string> = {
  value: T;
  label: string;
  iso6391?: string;
};

type LanguageSelectAppearance = 'default' | 'compact';

type LanguageSelectProps<T extends string = string> = {
  value: T;
  options: readonly LanguageSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  listAriaLabel?: string;
  align?: 'start' | 'end';
  appearance?: LanguageSelectAppearance;
  triggerRef?: React.Ref<HTMLButtonElement>;
};

const triggerClassByAppearance: Record<LanguageSelectAppearance, string> = {
  default:
    'inline-flex h-8 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-warm ps-2.5 pe-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30 disabled:cursor-not-allowed disabled:opacity-60',
  compact:
    'inline-flex max-w-full cursor-pointer items-center gap-1 overflow-hidden rounded border border-border bg-paper py-0.5 ps-2 pe-1.5 text-tiny font-semibold text-ink-secondary transition-colors hover:bg-warm focus:outline-none focus-visible:ring-1 focus-visible:ring-carbon/30 disabled:cursor-not-allowed disabled:opacity-60',
};

const optionClassName = (isHighlighted: boolean, isSelected: boolean) => {
  if (isHighlighted) return 'bg-parchment text-ink';
  if (isSelected) return 'bg-warm text-ink';
  return 'text-ink-secondary hover:bg-parchment';
};

type WritableRef<T> = { current: T | null };

const isWritableRef = <T,>(ref: object): ref is WritableRef<T> => 'current' in ref;

const assignRef = <T,>(ref: React.Ref<T> | undefined, value: T | null) => {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref && isWritableRef<T>(ref)) {
    ref.current = value;
  }
};

const LanguageSelect = <T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
  listAriaLabel = 'Language selection',
  align = 'start',
  appearance = 'default',
  triggerRef,
}: LanguageSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const isMobile = useIsMobile();
  const current = options.find(option => option.value === value) ?? options[0];
  const triggerLabel =
    isMobile && current?.iso6391 ? current.iso6391.toUpperCase() : (current?.label ?? '');
  const {
    highlightedIndex,
    listboxRef,
    triggerElementRef,
    onTriggerKeyDown,
    onTriggerClick,
    clearPrefix,
  } = useLanguageSelectListbox({ open, setOpen, options, value, onChange, disabled });

  const activeOption = options[highlightedIndex];
  const activeDescendantId = activeOption ? `${listboxId}-option-${activeOption.value}` : undefined;

  return (
    <div className={appearance === 'default' ? 'relative shrink-0' : 'relative inline-flex'}>
      <button
        ref={node => {
          triggerElementRef.current = node;
          assignRef(triggerRef, node);
        }}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        className={triggerClassByAppearance[appearance]}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDownIcon
          className={
            appearance === 'compact'
              ? 'size-2.5 shrink-0 text-ink-tertiary'
              : 'size-3.5 shrink-0 text-ink-tertiary'
          }
          aria-hidden
        />
      </button>
      {open && !disabled ? (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={listAriaLabel}
            aria-activedescendant={activeDescendantId}
            className={`absolute top-full z-20 mt-1 max-h-60 min-w-full overflow-y-auto rounded-md border border-border bg-paper shadow-md focus:outline-none ${
              align === 'end' ? 'inset-e-0' : 'inset-s-0'
            }`}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                id={`${listboxId}-option-${option.value}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  clearPrefix();
                }}
                className={`block w-full whitespace-nowrap px-3 py-2 text-left text-xs font-medium transition-colors ${optionClassName(
                  index === highlightedIndex,
                  option.value === value
                )}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

export { LanguageSelect };
export type { LanguageSelectOption, LanguageSelectProps, LanguageSelectAppearance };
