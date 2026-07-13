/* eslint-disable react/require-default-props, react/jsx-props-no-spreading */
import React, { ChangeEventHandler, CSSProperties, Ref } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { InputError } from './InputError.js';
import { Label } from './Label.js';

type FieldState = { disabled?: boolean; hasError?: boolean };

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
  clearFieldAction?: () => void;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  onSelect?: ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: ChangeEventHandler<HTMLTextAreaElement>;
  resize?: CSSProperties['resize'];
  rows?: number;
}

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const textareaBase =
  'w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-carbon/40 focus:outline-none focus:ring-2 focus:ring-carbon/20';

const textareaClass = (state: FieldState, hasClear: boolean) =>
  cx(
    textareaBase,
    state.hasError && 'border-emphasis bg-seal-tint text-seal',
    state.disabled && 'cursor-not-allowed bg-warm text-ink-muted',
    hasClear && 'pr-10'
  );

const clearButtonClass =
  'absolute right-0 top-px rounded-r-lg p-2.5 text-sm font-medium focus:outline-hidden enabled:hover:text-carbon disabled:text-ink-muted';

const Textarea = React.forwardRef(
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
      name = '',
      clearFieldAction,
      onChange,
      onSelect,
      onBlur,
      resize = 'none',
      rows = 4,
    }: TextareaProps,
    ref: Ref<HTMLTextAreaElement>
  ) => {
    const state: FieldState = { disabled, hasError: Boolean(hasErrors || errorMessage) };
    const hasClear = Boolean(clearFieldAction);

    return (
      <div className={className}>
        <Label htmlFor={id} hideLabel={!label || hideLabel} hasErrors={state.hasError}>
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
            {...(value !== undefined ? { value } : {})}
            className={textareaClass(state, hasClear)}
            rows={rows}
            placeholder={placeholder}
            style={{ resize }}
          />
          {hasClear && (
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
        </div>
        {errorMessage && <InputError>{errorMessage}</InputError>}
      </div>
    );
  }
);

export type { TextareaProps };
export { Textarea };
