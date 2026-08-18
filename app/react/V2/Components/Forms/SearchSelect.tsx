/* eslint-disable max-lines */
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { Label } from './Label.js';

type FieldState = { disabled?: boolean; hasError?: boolean };

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const shellBase =
  'flex w-full items-center rounded-lg border border-border bg-paper focus-within:outline-none focus-within:ring-2 focus-within:ring-carbon/20';

const shellClass = (state: FieldState) =>
  cx(
    shellBase,
    state.hasError && 'border-emphasis bg-seal-tint',
    state.disabled && 'cursor-not-allowed bg-warm'
  );

const compactSelectInputClassName =
  'w-full min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm font-normal text-ink placeholder:text-sm placeholder:font-normal placeholder:text-ink-muted focus:outline-none disabled:cursor-not-allowed';

const compactSelectValueClassName =
  'relative flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-left text-sm font-normal text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon/20 disabled:cursor-not-allowed';

const compactSelectDropdownClassName =
  'mt-1.5 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-paper shadow-sm';

const compactSelectOptionClassName =
  'w-full px-3 py-2 text-left text-sm font-normal text-ink transition-colors hover:bg-warm';

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

const CaretIcon = ({ open }: { open: boolean }) => {
  const Icon = open ? ChevronUpIcon : ChevronDownIcon;
  return (
    <span
      data-testid="search-select-caret"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
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
  const listboxId = `${fieldId}-listbox`;
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

  const closeSearch = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  const openSearch = () => {
    if (disabled) {
      return;
    }

    setIsOpen(true);
    setSearchTerm('');
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (event.key === 'ArrowDown' && !isOpen && !disabled) {
      event.preventDefault();
      openSearch();
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    closeSearch();
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange?.('');
    closeSearch();
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
        <div className={cx(shellClass(state), 'relative')}>
          <button
            type="button"
            id={fieldId}
            disabled={disabled}
            onClick={openSearch}
            className={cx(compactSelectValueClassName, 'pr-8 text-ink-muted')}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={listboxId}
          >
            <span className="min-w-0 flex-1 truncate">{placeholder}</span>
            <CaretIcon open={false} />
          </button>
        </div>
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
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={listboxId}
          >
            {selectedOption?.prefix && (
              <span className="inline-flex shrink-0 items-center">{selectedOption.prefix}</span>
            )}
            <span className="min-w-0 flex-1 truncate">{selectedOption?.searchLabel}</span>
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
          role="combobox"
          autoComplete="off"
          disabled={disabled}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={openSearch}
          onChange={event => setSearchTerm(event.currentTarget.value)}
          className={cx(compactSelectInputClassName, !hasSelection && 'pr-8')}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
        />
        {!hasSelection && <CaretIcon open />}
      </div>
    );
  };

  return (
    <div
      className={cx('flex flex-col gap-1.5', className)}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <Label htmlFor={fieldId} hideLabel={hideLabel} hasErrors={hasErrors}>
        {label}
      </Label>

      {renderFieldControl()}

      {isOpen && !disabled && (
        <ul className={compactSelectDropdownClassName} role="listbox" id={listboxId}>
          {filteredOptions.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-muted" role="presentation">
              <Translate>No results found</Translate>
            </li>
          )}

          {groupedOptions.map(({ label: groupLabel, options: groupItems }) => (
            <li
              key={groupLabel || 'default'}
              role={groupLabel ? 'group' : 'presentation'}
              aria-label={groupLabel || undefined}
            >
              {groupLabel && (
                <div className="px-3 pt-2 pb-1 text-sm font-semibold text-ink-muted" aria-hidden>
                  {groupLabel}
                </div>
              )}
              {groupItems.map(option => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
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
                );
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export type { SearchSelectOption, SearchSelectGroup, SearchSelectProps };
export { SearchSelect };
