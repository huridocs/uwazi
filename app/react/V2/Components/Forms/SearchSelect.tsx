/* eslint-disable max-lines */
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { Label } from './Label.js';

type FieldState = { disabled?: boolean; hasError?: boolean };

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const shellBase =
  'flex h-8 w-full items-center rounded-lg border border-border bg-paper focus-within:outline-none focus-within:ring-2 focus-within:ring-carbon/20';

const shellClass = (state: FieldState) =>
  cx(
    shellBase,
    state.hasError && 'border-emphasis bg-seal-tint',
    state.disabled && 'cursor-not-allowed bg-warm'
  );

const inputBase =
  'w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-carbon/40 focus:outline-none focus:ring-2 focus:ring-carbon/20';

const triggerClass = (state: FieldState) =>
  cx(
    inputBase,
    state.hasError && 'border-emphasis bg-seal-tint text-seal',
    state.disabled && 'cursor-not-allowed bg-warm text-ink-muted opacity-50',
    'w-full text-left text-ink-muted'
  );

const compactSelectInputClassName =
  'h-8 min-h-8 w-full min-w-0 flex-1 border-0 bg-transparent pl-3 pr-8 text-xs font-medium text-ink placeholder:text-ink-muted focus:outline-none disabled:cursor-not-allowed';

const compactSelectValueClassName =
  'flex h-8 min-h-8 min-w-0 flex-1 items-center gap-1.5 truncate px-3 text-left text-xs font-medium text-ink disabled:cursor-not-allowed';

const compactSelectDropdownClassName =
  'absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-paper shadow-sm';

const compactSelectOptionClassName =
  'w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-warm';

const compactSelectOptionSelectedClassName = 'bg-carbon-tint hover:bg-carbon-tint';

type SearchSelectOption = {
  value: string;
  searchLabel: string;
  label: React.ReactNode;
  prefix?: React.ReactNode;
  group?: string;
};

type SearchSelectGroup = {
  label: string;
  options: Omit<SearchSelectOption, 'group'>[];
};

type SearchSelectProps = {
  id?: string;
  label?: string | React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  hasErrors?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  className?: string;
  options?: SearchSelectOption[];
  groups?: SearchSelectGroup[];
};

const normalizeSearch = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const flattenOptions = (options: SearchSelectOption[] = [], groups: SearchSelectGroup[] = []) => [
  ...options,
  ...groups.flatMap(group =>
    group.options.map(option => ({
      ...option,
      group: group.label,
    }))
  ),
];

const filterOptions = (options: SearchSelectOption[], search: string) => {
  if (!search) {
    return options;
  }

  const normalizedSearch = normalizeSearch(search);
  return options.filter(option => normalizeSearch(option.searchLabel).includes(normalizedSearch));
};

const groupOptions = (options: SearchSelectOption[]) => {
  const groups = new Map<string, SearchSelectOption[]>();

  options.forEach(option => {
    const groupLabel = option.group ?? '';
    const current = groups.get(groupLabel) ?? [];
    current.push(option);
    groups.set(groupLabel, current);
  });

  return Array.from(groups.entries()).map(([label, groupOptionsList]) => ({
    label,
    options: groupOptionsList,
  }));
};

// eslint-disable-next-line max-statements
const SearchSelect = ({
  id,
  label,
  value = '',
  onChange,
  disabled = false,
  hasErrors = false,
  hideLabel = false,
  placeholder = 'Search',
  className = '',
  options = [],
  groups = [],
}: SearchSelectProps) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const state: FieldState = { disabled, hasError: hasErrors };
  const allOptions = useMemo(() => flattenOptions(options, groups), [groups, options]);
  const selectedOption = allOptions.find(option => option.value === value);
  const hasSelection = Boolean(value && selectedOption);
  const showClosedSelection = hasSelection && !isOpen;
  const showClearButton = Boolean(value && selectedOption) && !disabled && showClosedSelection;
  const showTrigger = !hasSelection && !isOpen;

  const filteredOptions = useMemo(
    () => filterOptions(allOptions, searchTerm),
    [allOptions, searchTerm]
  );

  const groupedOptions = useMemo(() => groupOptions(filteredOptions), [filteredOptions]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const openSearch = () => {
    if (disabled) {
      return;
    }

    setIsOpen(true);
    setSearchTerm('');
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange?.('');
    setIsOpen(false);
    setSearchTerm('');
  };

  const renderOptionLabel = (option: SearchSelectOption) => {
    if (option.prefix) {
      return (
        <span className="flex items-center gap-2 text-sm">
          <span className="inline-flex shrink-0 justify-center">{option.prefix}</span>
          <span>{option.label}</span>
        </span>
      );
    }

    return option.label;
  };

  const renderFieldControl = () => {
    if (showTrigger) {
      return (
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          onClick={openSearch}
          className={triggerClass(state)}
        >
          {placeholder}
        </button>
      );
    }

    if (showClosedSelection) {
      return (
        <div className={cx(shellClass(state), 'relative')}>
          <button
            type="button"
            id={fieldId}
            disabled={disabled}
            onClick={openSearch}
            className={cx(compactSelectValueClassName, showClearButton && 'pr-8')}
          >
            {selectedOption?.prefix && (
              <span className="inline-flex shrink-0 items-center">{selectedOption.prefix}</span>
            )}
            <span className="truncate">{selectedOption?.searchLabel}</span>
          </button>
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              data-testid="clear-field-button"
              className="absolute right-1 top-1/2 flex h-6 w-6 shrink-0 -translate-y-1/2 items-center justify-center rounded-md hover:cursor-pointer focus:outline-hidden enabled:hover:text-ink-secondary disabled:opacity-50"
            >
              <XMarkIcon className="h-3.5 w-3.5 text-ink-muted" />
              <Translate className="sr-only">Clear</Translate>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={cx(shellClass(state), 'relative')}>
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={openSearch}
          onChange={event => setSearchTerm(event.currentTarget.value)}
          className={compactSelectInputClassName}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
          <MagnifyingGlassIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Label htmlFor={fieldId} hideLabel={hideLabel} hasErrors={hasErrors}>
        {label}
      </Label>

      {renderFieldControl()}

      {isOpen && !disabled && (
        <ul className={compactSelectDropdownClassName} role="listbox">
          {filteredOptions.length === 0 && (
            <li className="px-3 py-2 text-xs text-ink-muted">
              <Translate>No results found</Translate>
            </li>
          )}

          {groupedOptions.map(({ label: groupLabel, options: groupItems }) => (
            <li key={groupLabel || 'default'}>
              {groupLabel && (
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-ink-muted">
                  {groupLabel}
                </div>
              )}
              <ul>
                {groupItems.map(option => {
                  const isSelected = option.value === value;

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={cx(
                          compactSelectOptionClassName,
                          isSelected && compactSelectOptionSelectedClassName
                        )}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => handleSelect(option.value)}
                      >
                        {renderOptionLabel(option)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export type { SearchSelectOption, SearchSelectGroup, SearchSelectProps };
export { SearchSelect };
