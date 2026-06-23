import React, { ChangeEventHandler, CSSProperties, Ref } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { InputError } from './InputError.js';
import { Label } from './Label.js';

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
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'search' | 'file';
  autoComplete?: 'on' | 'off';
  preText?: string | React.ReactNode;
  name?: string;
  clearFieldAction?: () => void;
  icon?: React.ReactNode;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSelect?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
}

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
      onChange = () => {},
      onSelect = () => {},
      onBlur = () => {},
    }: InputFieldProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const showError = Boolean(hasErrors || errorMessage);

    const hasValue = value !== undefined && value !== null && value !== '';
    const showClearButton = Boolean(clearFieldAction) && (hasValue || !icon);
    const showIcon = icon && (!clearFieldAction || !hasValue);
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

    const preTextStyle: CSSProperties = {
      borderColor: showError
        ? 'var(--color-theme-control-border-error)'
        : 'var(--color-theme-control-border)',
      backgroundColor: 'var(--color-theme-control-pretext-bg)',
      color: 'var(--color-theme-control-pretext-text)',
    };

    return (
      <div className={className}>
        <Label
          htmlFor={id}
          hideLabel={!label || hideLabel}
          hasErrors={Boolean(hasErrors || errorMessage)}
        >
          {label}
        </Label>
        <div className="relative flex w-full">
          {preText && (
            <span
              className="inline-flex items-center rounded-e-0 rounded-s-md border border-r-0 px-3 text-sm"
              style={preTextStyle}
            >
              {preText}
            </span>
          )}
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
            className={`block w-full flex-1 border text-sm placeholder:text-(--color-theme-control-placeholder) focus:outline-hidden ${
              showError
                ? 'focus:border-(--color-theme-control-border-error) focus:[box-shadow:0_0_0_4px_var(--color-theme-control-error-ring)]'
                : 'focus:border-(--color-theme-control-border-focus) focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]'
            } ${clearFieldAction || icon ? 'pr-10' : ''} ${
              type !== 'file' ? 'p-2.5' : ''
            } ${preText ? 'rounded-none rounded-e-lg' : 'rounded-lg'} ${
              type === 'search'
                ? '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden'
                : ''
            }`}
            style={fieldStyle}
            placeholder={placeholder}
          />
          {showClearButton && (
            <button
              type="button"
              onClick={clearFieldAction}
              disabled={disabled}
              data-testid="clear-field-button"
              className="absolute right-0 top-px rounded-r-lg p-2.5 text-sm font-medium focus:outline-hidden enabled:hover:text-(--color-theme-control-clear-hover-fg) disabled:text-(--color-theme-control-text-muted) w-fit hover:cursor-pointer"
              style={{
                color: showError
                  ? 'var(--color-theme-control-text-error)'
                  : 'var(--color-theme-control-clear-fg)',
              }}
            >
              <XMarkIcon className="w-5" />
              <Translate className="sr-only">Clear</Translate>
            </button>
          )}
          {showIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
