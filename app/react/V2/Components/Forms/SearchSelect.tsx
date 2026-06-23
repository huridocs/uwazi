import React, { CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { Label } from './Label.js';
import {
  filterSearchSelectOptions,
  flattenSearchSelectOptions,
  groupSearchSelectOptions,
} from './searchSelectUtils.js';

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
  label: string | React.ReactNode;
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

  const allOptions = useMemo(
    () => flattenSearchSelectOptions(options, groups),
    [groups, options]
  );

  const selectedOption = allOptions.find(option => option.value === value);
  const hasSelection = Boolean(value && selectedOption);
  const showClosedSelection = hasSelection && !isOpen;
  const showClearButton = hasSelection && !disabled;

  const filteredOptions = useMemo(
    () => filterSearchSelectOptions(allOptions, searchTerm),
    [allOptions, searchTerm]
  );

  const groupedOptions = useMemo(
    () => groupSearchSelectOptions(filteredOptions),
    [filteredOptions]
  );

  const showError = Boolean(hasErrors);
  let backgroundColor = 'var(--color-theme-control-bg)';
  let textColor = 'var(--color-theme-control-text)';

  if (disabled) {
    backgroundColor = 'var(--color-theme-control-bg-disabled)';
    textColor = 'var(--color-theme-control-text-disabled)';
  } else if (showError) {
    backgroundColor = 'var(--color-theme-control-bg-error)';
    textColor = 'var(--color-theme-control-text-error)';
  }

  const fieldStyle: CSSProperties = {
    borderColor: showError
      ? 'var(--color-theme-control-border-error)'
      : 'var(--color-theme-control-border)',
    backgroundColor,
    color: textColor,
  };

  const fieldClassName = `flex w-full items-center rounded-lg border text-sm focus-within:outline-hidden ${
    showError
      ? 'focus-within:border-(--color-theme-control-border-error) focus-within:[box-shadow:0_0_0_4px_var(--color-theme-control-error-ring)]'
      : 'focus-within:border-(--color-theme-control-border-focus) focus-within:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]'
  }`;

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
        <span className="flex items-center gap-2">
          <span className="inline-flex w-6 shrink-0 justify-center">{option.prefix}</span>
          <span>{option.label}</span>
        </span>
      );
    }

    return option.label;
  };

  const renderClearButton = () => (
    <button
      type="button"
      onClick={handleClear}
      disabled={disabled}
      data-testid="clear-field-button"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md focus:outline-hidden enabled:hover:text-(--color-theme-control-clear-hover-fg) disabled:text-(--color-theme-control-text-muted) hover:cursor-pointer"
      style={{
        color: showError
          ? 'var(--color-theme-control-text-error)'
          : 'var(--color-theme-control-clear-fg)',
      }}
    >
      <XMarkIcon className="h-5 w-5" />
      <Translate className="sr-only">Clear</Translate>
    </button>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Label htmlFor={fieldId} hideLabel={hideLabel} hasErrors={showError}>
        {label}
      </Label>

      {showClosedSelection ? (
        <div className={fieldClassName} style={fieldStyle}>
          <button
            type="button"
            id={fieldId}
            disabled={disabled}
            onClick={openSearch}
            className="flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-2.5 text-left text-sm disabled:cursor-not-allowed"
            style={{ color: textColor }}
          >
            {selectedOption?.prefix && (
              <span className="inline-flex shrink-0 items-center">{selectedOption.prefix}</span>
            )}
            <span className="truncate">{selectedOption?.searchLabel}</span>
          </button>
          {showClearButton && renderClearButton()}
        </div>
      ) : (
        <div className={fieldClassName} style={fieldStyle}>
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
            className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2.5 text-sm placeholder:text-(--color-theme-control-placeholder) focus:outline-hidden disabled:cursor-not-allowed"
            style={{ color: textColor }}
          />
          <div className="flex shrink-0 items-center pr-1">
            <span className="pointer-events-none flex h-9 w-9 items-center justify-center text-(--color-theme-control-text-muted)">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </span>
            {showClearButton && renderClearButton()}
          </div>
        </div>
      )}

      {isOpen && !disabled && (
        <ul
          className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-(--color-theme-control-border-focus) bg-(--color-theme-control-bg) py-1 shadow-sm"
          role="listbox"
        >
          {filteredOptions.length === 0 && (
            <li className="px-3 py-2 text-sm text-(--color-theme-control-text-muted)">
              No results
            </li>
          )}

          {groupedOptions.map(({ label: groupLabel, options: groupItems }) => (
            <li key={groupLabel || 'default'}>
              {groupLabel && (
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-(--color-theme-control-text-muted)">
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
                        className={`w-full px-3 py-2 text-left text-sm text-(--color-theme-control-text) hover:bg-(--color-theme-control-ring) ${
                          isSelected ? 'bg-(--color-theme-control-ring)' : ''
                        }`}
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
