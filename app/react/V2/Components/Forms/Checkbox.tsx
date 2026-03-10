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
  ({ name, onChange, className, disabled, checked, label }: CheckboxProps, ref: Ref<any>) => (
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
          className="
            relative
            flex
            h-4 w-4
            shrink-0
            items-center
            justify-center
            rounded
            border border-gray-300
            bg-gray-100
            transition

            peer-checked:bg-primary-600
            peer-checked:border-primary-600

            peer-disabled:opacity-50
            peer-disabled:cursor-not-allowed

            peer-focus-visible:ring-2
            peer-focus-visible:ring-primary-500
            peer-focus-visible:ring-offset-2

            after:absolute
            after:h-2
            after:w-1
            after:rotate-45
            after:border-r-2
            after:border-b-2
            after:border-white
            after:opacity-0
            after:content-['']

            peer-checked:after:opacity-100"
        />
      </div>
      <label
        htmlFor={name}
        className={`text-sm cursor-pointer ${checked ? 'text-gray-900' : 'text-gray-600'} ${disabled ? 'text-gray-500 cursor-not-allowed' : ''}`}
      >
        {isString(label) ? <Translate>{label}</Translate> : label}
      </label>
    </fieldset>
  )
);

export { Checkbox };
