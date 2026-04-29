import React, { ChangeEventHandler, CSSProperties } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { InputError } from './InputError.js';
import { Label } from './Label.js';

interface TextareaProps {
  id: string;
  label?: string | React.ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  errorMessage?: string | React.ReactNode;
  value?: string;
  className?: string;
  name?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
  clearFieldAction?: () => void;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  onSelect?: ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: ChangeEventHandler<HTMLTextAreaElement>;
  resize?: CSSProperties['resize'];
  rows?: number;
}

const Textarea = ({
  id,
  label,
  disabled,
  hideLabel,
  placeholder,
  hasErrors,
  errorMessage,
  value,
  className = '',
  name = '',
  ref,
  clearFieldAction,
  onChange = () => {},
  onSelect = () => {},
  onBlur = () => {},
  resize = 'none',
  rows = 4,
}: TextareaProps) => {
  const showError = Boolean(hasErrors || errorMessage);
  let backgroundColor = 'var(--color-theme-control-bg)';

  if (disabled) {
    backgroundColor = 'var(--color-theme-control-bg-disabled)';
  } else if (showError) {
    backgroundColor = 'var(--color-theme-control-bg-error)';
  }

  const fieldStyle: CSSProperties = {
    borderColor: showError
      ? 'var(--color-theme-control-border-error)'
      : 'var(--color-theme-control-border)',
    backgroundColor,
    color: showError ? 'var(--color-theme-control-text-error)' : 'var(--color-theme-control-text)',
    resize,
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
        <textarea
          id={id}
          onSelect={onSelect}
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          ref={ref}
          disabled={disabled}
          value={value}
          className={`block w-full flex-1 rounded-sm border text-sm placeholder:[color:var(--color-theme-control-placeholder)] focus:outline-hidden ${
            showError
              ? 'focus:[border-color:var(--color-theme-control-border-error)] focus:[box-shadow:0_0_0_4px_var(--color-theme-control-error-ring)]'
              : 'focus:[border-color:var(--color-theme-control-border-focus)] focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]'
          } ${clearFieldAction ? 'pr-10' : ''}`}
          rows={rows}
          placeholder={placeholder}
          style={fieldStyle}
        />
        {Boolean(clearFieldAction) && (
          <button
            type="button"
            onClick={clearFieldAction}
            disabled={disabled}
            data-testid="clear-field-button"
            className="absolute right-0 top-px rounded-r-lg p-2.5 text-sm font-medium focus:outline-hidden enabled:hover:[color:var(--color-theme-control-clear-hover-fg)] disabled:[color:var(--color-theme-control-text-muted)]"
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
      </div>
      {errorMessage && <InputError>{errorMessage}</InputError>}
    </div>
  );
};

export type { TextareaProps };
export { Textarea };
