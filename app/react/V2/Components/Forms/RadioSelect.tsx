import React, { ReactEventHandler } from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';
import { Option } from './SelectTypes.js';

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

const radioVisualClassName =
  "pointer-events-none relative flex h-4 w-4 items-center justify-center rounded-full border border-(--color-theme-control-border) bg-(--color-theme-control-bg) after:absolute after:h-2 after:w-2 after:rounded-full after:bg-(--color-theme-accent-primary) after:opacity-0 after:content-[''] peer-checked:border-(--color-theme-accent-primary) peer-checked:after:opacity-100 peer-disabled:opacity-50";

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
    {legend && <legend className="mb-2 text-sm font-medium text-ink">{legend}</legend>}
    {options.map(option => (
      <div
        className={`flex items-center gap-2 ${orientation === 'vertical' ? '' : 'mr-4'}`}
        key={option.id || option.value}
      >
        <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            type="radio"
            id={`${name}_${option.value}`}
            name={name}
            value={option.value}
            disabled={option.disabled || false}
            onChange={onChange}
            defaultChecked={option.defaultChecked}
            checked={option.checked}
            className="peer absolute inset-0 z-10 h-4 w-4 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span aria-hidden="true" className={radioVisualClassName} />
        </span>
        <label
          htmlFor={`${name}_${option.value}`}
          className={`cursor-pointer text-sm leading-4 text-ink ${
            option.disabled ? 'cursor-not-allowed text-ink-muted' : ''
          }`}
        >
          {isString(option.label) ? <Translate>{option.label}</Translate> : option.label}
        </label>
      </div>
    ))}
  </fieldset>
);

export type { RadioProps };
export { RadioSelect };
