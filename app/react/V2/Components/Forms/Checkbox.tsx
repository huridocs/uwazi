/* eslint-disable react/require-default-props */
import React, { ReactEventHandler, Ref } from 'react';
import { Checkbox as FlowbiteCheckbox, Label } from 'flowbite-react';
import { isString } from 'lodash';
import { Translate } from 'app/I18N';

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
    <fieldset className={`flex flex-wrap gap-4 ${className}`} id={`radio_${name}`}>
      <div className="flex items-center w-full gap-2 mr-4">
        <FlowbiteCheckbox
          checked={checked}
          id={name}
          name={name}
          disabled={disabled || false}
          onChange={onChange}
          ref={ref}
          color={disabled ? 'gray' : 'indigo'}
        />
        <Label
          htmlFor={name}
          className={`w-full text-sm font-medium text-gray-900 cursor-pointer ${disabled ? '!text-gray-500' : ''}`}
        >
          {isString(label) ? <Translate>{label}</Translate> : label}
        </Label>
      </div>
    </fieldset>
  )
);

export { Checkbox };
