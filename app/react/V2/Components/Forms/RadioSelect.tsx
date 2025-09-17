import React, { ReactEventHandler } from 'react';
import { Radio, Label } from 'flowbite-react';
import { isString } from 'lodash';
import { Translate } from 'app/I18N';
import { Option } from './SelectTypes';

interface RadioProps {
  legend?: string | React.ReactNode;
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  options: (Option & {
    defaultChecked?: boolean;
    checked?: boolean;
  })[];
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

const RadioSelect = ({
  legend,
  options,
  name,
  onChange,
  className,
  orientation = 'vertical',
}: RadioProps) => (
  <fieldset
    className={`flex flex-wrap gap-4 ${
      orientation === 'vertical' ? 'flex-col max-w-md' : ''
    } ${className}`}
    id={`radio_${name}`}
  >
    {legend && <legend className="mb-2 text-sm font-medium text-gray-700">{legend}</legend>}
    {options.map(option => (
      <div
        className={`flex items-center gap-2 ${orientation === 'vertical' ? '' : 'mr-4'}`}
        key={option.id || option.value}
      >
        <Radio
          id={`${name}_${option.value}`}
          name={name}
          value={option.value}
          disabled={option.disabled || false}
          onChange={onChange}
          defaultChecked={option.defaultChecked}
          checked={option.checked}
          className={option.disabled ? '!bg-gray-300 !border-gray-300' : ''}
        />
        <Label
          htmlFor={`${name}_${option.value}`}
          className={`cursor-pointer ${option.disabled ? '!text-gray-500' : ''}`}
        >
          {isString(option.label) ? <Translate>{option.label}</Translate> : option.label}
        </Label>
      </div>
    ))}
  </fieldset>
);

export type { RadioProps };
export { RadioSelect };
