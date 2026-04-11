/* eslint-disable react/require-default-props */
import React, { ReactEventHandler, Ref } from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

interface CheckboxProps {
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  checked?: boolean;
  label: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Checkbox = React.forwardRef(
  ({ name, onChange, className, disabled, checked, label }: CheckboxProps, ref: Ref<HTMLInputElement>) => (
    <fieldset className={`flex items-center gap-2 border-0 p-0 m-0 ${className}`}>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          id={name}
          name={name}
          disabled={disabled || false}
          onChange={onChange}
          ref={ref}
          className="peer absolute inset-0 h-4 w-4 opacity-0 cursor-pointer z-10"
        />
        <span
          aria-hidden="true"
          className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded border transition peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-focus-visible:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)] after:absolute after:h-2 after:w-1 after:rotate-45 after:border-b-2 after:border-r-2 after:border-white after:opacity-0 after:content-[''] peer-checked:after:opacity-100"
          style={{
            borderColor: checked
              ? 'var(--color-theme-accent-primary)'
              : 'var(--color-theme-control-border)',
            backgroundColor: checked
              ? 'var(--color-theme-accent-primary)'
              : 'var(--color-theme-control-bg)',
          }}
        />
      </div>
      <label
        htmlFor={name}
        className={`cursor-pointer text-sm ${disabled ? 'cursor-not-allowed' : ''}`}
        style={{
          color: disabled
            ? 'var(--color-theme-control-text-muted)'
            : checked
              ? 'var(--color-theme-control-text)'
              : 'var(--color-theme-text-secondary)',
        }}
      >
        {isString(label) ? <Translate>{label}</Translate> : label}
      </label>
    </fieldset>
  )
);

export { Checkbox };
