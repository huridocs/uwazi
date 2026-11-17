/* eslint-disable react/require-default-props */
import React, { ChangeEventHandler, FocusEventHandler, MouseEventHandler, Ref } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { FieldLabelRow } from './FieldLabelRow.js';
import { InputError } from './InputError.js';
import { Label } from './Label.js';
import type { LabelVariant } from './Label.js';

type InputFieldType =
  'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'search' | 'url' | 'file';

type FieldState = { disabled?: boolean; hasError?: boolean };

interface InputFieldProps {
  id: string;
  label?: string | React.ReactNode;
  labelVariant?: LabelVariant;
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
  showClear?: boolean;
  icon?: React.ReactNode;
  overlay?: React.ReactNode;
  labelAccessory?: React.ReactNode;
  latched?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSelect?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onClick?: MouseEventHandler<HTMLInputElement>;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const searchReset =
  '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden';

const inputBase =
  'w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-normal text-ink placeholder:text-sm placeholder:font-normal placeholder:text-ink-muted focus:border-carbon/40 focus:outline-none focus:ring-2 focus:ring-carbon/20';

const inputClass = (
  state: FieldState,
  latched: boolean,
  ...extra: Array<string | false | undefined>
) =>
  cx(
    inputBase,
    latched && 'border-carbon/40 ring-2 ring-carbon/20',
    state.hasError && 'border-emphasis bg-seal-tint text-seal',
    state.disabled && 'cursor-not-allowed bg-warm text-ink-muted',
    ...extra
  );

const clearButtonClass = (besideOverlay: boolean) =>
  `absolute top-1/2 z-10 flex h-6 w-6 shrink-0 -translate-y-1/2 items-center justify-center rounded-md hover:cursor-pointer focus:outline-hidden enabled:hover:text-ink-secondary disabled:opacity-50 ${besideOverlay ? 'right-36' : 'right-1'}`;

const preTextClass =
  'inline-flex items-center rounded-e-0 rounded-s-md border border-r-0 border-border bg-vellum px-3 text-sm text-ink';

const noop = () => undefined;

const InputField = React.forwardRef(
  (
    {
      id,
      label,
      labelVariant,
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
      showClear = false,
      icon,
      overlay,
      labelAccessory,
      latched = false,
      onChange = noop,
      onSelect = noop,
      onBlur = noop,
      onFocus = noop,
      onClick = noop,
      min,
      max,
      step,
    }: InputFieldProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const state: FieldState = { disabled, hasError: Boolean(hasErrors || errorMessage) };
    const filled = value !== undefined && value !== null && value !== '';
    const showClearButton = Boolean(clearFieldAction) && (showClear || filled);
    const showIcon = icon && !showClearButton;
    let inputPadding: string | false = false;
    if (showClearButton) {
      inputPadding = overlay ? 'pr-44' : 'pr-8';
    } else if (showIcon) {
      inputPadding = 'pr-10';
    }
    return (
      <div className={cx('flex flex-col gap-1.5', className)}>
        <FieldLabelRow
          accessory={labelAccessory}
          label={
            <Label
              htmlFor={id}
              hideLabel={!label || hideLabel}
              hasErrors={state.hasError}
              variant={labelVariant}
            >
              {label}
            </Label>
          }
        />
        <div className="relative flex w-full">
          {preText && <span className={preTextClass}>{preText}</span>}
          <input
            type={type}
            autoComplete={autoComplete}
            id={id}
            onSelect={onSelect}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            onClick={onClick}
            name={name}
            ref={ref}
            disabled={disabled}
            value={value}
            className={inputClass(
              state,
              latched,
              inputPadding,
              Boolean(preText) && 'rounded-none rounded-e-md',
              type === 'search' && searchReset
            )}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
          />
          {showClearButton && (
            <button
              type="button"
              onClick={clearFieldAction}
              disabled={disabled}
              data-testid="clear-field-button"
              className={clearButtonClass(Boolean(overlay))}
            >
              <XMarkIcon className="h-3.5 w-3.5 text-ink-muted" />
              <Translate className="sr-only">Clear</Translate>
            </button>
          )}
          {showIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {icon}
            </div>
          )}
          {overlay}
        </div>
        {errorMessage ? <InputError>{errorMessage}</InputError> : null}
      </div>
    );
  }
);

export { InputField };
export type { InputFieldType };
