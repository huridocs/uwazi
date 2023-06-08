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

  orientation?: 'vertical' | 'horizontal';
}

const InlineRadio = ({ legend, options, name, onChange, orientation = 'vertical' }: RadioProps) => (
  <div className="tw-content">
    <fieldset
      className={`flex flex-wrap gap-4 ${orientation === 'vertical' ? 'flex-col max-w-md' : ''}`}
      id={`radio_${name}`}
    >
      {legend && <legend className="mb-4">{legend}</legend>}
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
