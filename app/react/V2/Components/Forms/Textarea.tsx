import React, { ChangeEventHandler, CSSProperties } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { InputError } from './InputError';
import { Label } from './Label';

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
  clearFieldAction?: () => any;
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
  let fieldStyles = 'border-gray-300 border text-gray-900 focus:ring-primary-500 bg-gray-50';
  let clearFieldStyles = 'enabled:hover:text-primary-700 text-gray-900';

  if (hasErrors || errorMessage) {
    fieldStyles =
      'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700';
    clearFieldStyles = 'enabled:hover:text-error-700 text-error-900';
  }

  if (clearFieldAction) {
    fieldStyles = `${fieldStyles} pr-10`;
  }

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
          className={`${fieldStyles} disabled:text-gray-500 block flex-1 w-full text-sm rounded`}
          rows={rows}
          placeholder={placeholder}
          style={{ resize }}
        />
        {Boolean(clearFieldAction) && (
          <button
            type="button"
            onClick={clearFieldAction}
            disabled={disabled}
            data-testid="clear-field-button"
            className={`${clearFieldStyles} top-px disabled:text-gray-500 absolute p-2.5 right-0 text-sm font-medium rounded-r-lg
             focus:outline-none`}
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
