/* eslint-disable react/require-default-props */
import React, { ChangeEventHandler, Ref } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { InputError } from './InputError.js';
import { Label } from './Label.js';

type InputFieldType =
  'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'search' | 'url' | 'file';

type FieldState = { disabled?: boolean; hasError?: boolean };

interface InputFieldProps {
  id: string;
  label?: string | React.ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  errorMessage?: string | React.ReactNode;
  value?: string | number;
  className?: string;
  type?: InputFieldType;
  autoComplete?: 'on' | 'off';
  preText?: string | React.ReactNode;
  name?: string;
  clearFieldAction?: () => void;
  icon?: React.ReactNode;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSelect?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
  min?: string | number;
  max?: string | number;
}

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const searchReset =
  '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden';

const inputBase =
  'w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-carbon/40 focus:outline-none focus:ring-2 focus:ring-carbon/20';

const inputClass = (state: FieldState, ...extra: Array<string | false | undefined>) =>
  cx(
    inputBase,
    state.hasError && 'border-emphasis bg-seal-tint text-seal',
    state.disabled && 'cursor-not-allowed bg-warm text-ink-muted',
    ...extra
  );

const clearButtonClass =
  'absolute right-0 top-px w-fit rounded-r-lg p-2.5 text-sm font-medium hover:cursor-pointer focus:outline-hidden enabled:hover:text-carbon disabled:text-ink-muted';

const preTextClass =
  'inline-flex items-center rounded-e-0 rounded-s-md border border-r-0 border-border bg-vellum px-3 text-sm text-ink';

const noop = () => undefined;

const InputField = React.forwardRef(
  (
    {
      id,
      label,
      disabled,
      hideLabel,
      placeholder,
      hasErrors,
      errorMessage,
      value,
      className = '',
      preText,
      type = 'text',
      autoComplete = 'on',
      name = '',
      clearFieldAction,
      icon,
      onChange = noop,
      onSelect = noop,
      onBlur = noop,
      min,
      max,
    }: InputFieldProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const state: FieldState = { disabled, hasError: Boolean(hasErrors || errorMessage) };
    const hasValue = value !== undefined && value !== null && value !== '';
    const hasClearOrIcon = Boolean(clearFieldAction || icon);
    const showClearButton = Boolean(clearFieldAction) && (hasValue || !icon);
    const showIcon = icon && (!clearFieldAction || !hasValue);

    return (
      <div className={className}>
        <Label htmlFor={id} hideLabel={!label || hideLabel} hasErrors={state.hasError}>
          {label}
        </Label>
        <div className="relative flex w-full">
          {preText && <span className={preTextClass}>{preText}</span>}
          <input
            type={type}
            autoComplete={autoComplete}
            id={id}
            onSelect={onSelect}
            onChange={onChange}
            onBlur={onBlur}
            name={name}
            ref={ref}
            disabled={disabled}
            value={value}
            className={inputClass(
              state,
              hasClearOrIcon && 'pr-10',
              Boolean(preText) && 'rounded-none rounded-e-md',
              type === 'search' && searchReset
            )}
            placeholder={placeholder}
            min={min}
            max={max}
          />
          {showClearButton && (
            <button
              type="button"
              onClick={clearFieldAction}
              disabled={disabled}
              data-testid="clear-field-button"
              className={clearButtonClass}
            >
              <XMarkIcon className="w-5" />
              <Translate className="sr-only">Clear</Translate>
            </button>
          )}
          {showIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {icon}
            </div>
          )}
        </div>
        {errorMessage && <InputError>{errorMessage}</InputError>}
      </div>
    );
  }
);

export { InputField };
export type { InputFieldType };
