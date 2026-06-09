/* eslint-disable react/require-default-props */
import React, { ReactEventHandler, Ref, useEffect, useImperativeHandle, useRef } from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

interface CheckboxProps {
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  checked?: boolean;
  indeterminate?: boolean;
  label: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const checkboxInputClassName = [
  'h-4 w-4 shrink-0 cursor-pointer rounded-sm',
  'border border-(--color-theme-control-border) bg-(--color-theme-control-bg)',
  '[accent-color:var(--color-theme-accent-primary)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'focus-visible:outline-hidden focus-visible:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]',
].join(' ');

const Checkbox = React.forwardRef(
  (
    { name, onChange, className, disabled, checked, indeterminate = false, label }: CheckboxProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, checked]);

    const labelClassName = [
      'text-sm',
      disabled
        ? 'cursor-not-allowed text-(--color-theme-control-text-muted)'
        : 'cursor-pointer text-ink-secondary',
      checked || indeterminate ? 'text-(--color-theme-control-text)' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <fieldset className={`flex items-center gap-2 border-0 p-0 m-0 ${className ?? ''}`}>
        <input
          type="checkbox"
          checked={checked}
          id={name}
          name={name}
          disabled={disabled || false}
          onChange={onChange}
          ref={inputRef}
          className={checkboxInputClassName}
        />
        <label htmlFor={name} className={labelClassName}>
          {isString(label) ? <Translate>{label}</Translate> : label}
        </label>
      </fieldset>
    );
  }
);

export { Checkbox, checkboxInputClassName };
