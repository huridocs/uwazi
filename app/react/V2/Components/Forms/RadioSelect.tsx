import React, { ReactEventHandler } from 'react';
import { Radio, Label } from 'flowbite-react';
import { Translate } from 'app/I18N';
import { Option } from './SelectTypes';

interface RadioProps {
  legend: string;
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  options: (Option & {
    defaultChecked?: boolean;
  })[];
}

const InlineRadio = ({ legend, options, name, onChange }: RadioProps) => (
  <div className="tw-content">
    <fieldset className="flex flex-col max-w-md gap-4" id="radio">
      {legend && <legend className="mb-4">Choose your favorite country</legend>}
      {options.map(option => (
        <div className="flex items-center gap-2" key={option.id || option.value}>
          <Radio
            id={`${name}_${option.value}`}
            name={name}
            value={option.value}
            disabled={option.disabled || false}
            defaultChecked={option.defaultChecked}
            onChange={onChange}
          />
          <Label
            htmlFor={option.id || option.value}
            className={option.disabled ? '!text-gray-300' : ''}
          >
            <Translate>{option.label}</Translate>
          </Label>
        </div>
      ))}
    </fieldset>
  </div>
);

export { InlineRadio as RadioSelect };
