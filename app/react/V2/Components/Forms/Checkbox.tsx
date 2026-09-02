/* eslint-disable react/require-default-props */
import React, { ReactEventHandler, Ref, useEffect, useImperativeHandle, useRef } from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

type CheckboxTone = 'ink' | 'carbon';

interface CheckboxProps {
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  checked?: boolean;
  indeterminate?: boolean;
  label: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
  tone?: CheckboxTone;
}

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const nativeCheckboxClassName = (tone: CheckboxTone = 'ink'): string =>
  cx(
    'm-0 h-3.5 w-3.5 shrink-0 cursor-pointer rounded',
    tone === 'carbon' ? 'accent-carbon' : 'accent-ink',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-carbon/30'
  );

const checkboxInputClassName = nativeCheckboxClassName('ink');
const filterCheckboxClassName = nativeCheckboxClassName('carbon');
const checkboxToneClass: Record<CheckboxTone, string> = {
  ink: checkboxInputClassName,
  carbon: filterCheckboxClassName,
};

const Checkbox = React.forwardRef(
  (
    {
      name,
      onChange,
      className,
      disabled = false,
      checked,
      indeterminate = false,
      label,
      tone = 'ink',
    }: CheckboxProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, checked]);

    return (
      <fieldset className={cx('m-0 min-w-0 border-0 p-0', className)}>
        <label
          htmlFor={name}
          className={cx(
            'flex min-w-0 cursor-pointer items-center gap-2 text-sm leading-none text-ink-secondary',
            disabled && 'cursor-not-allowed text-ink-muted'
          )}
        >
          <input
            type="checkbox"
            checked={checked}
            id={name}
            name={name}
            disabled={disabled}
            onChange={onChange}
            ref={inputRef}
            className={nativeCheckboxClassName(tone)}
          />
          {isString(label) ? <Translate>{label}</Translate> : label}
        </label>
      </fieldset>
    );
  }
);

export {
  Checkbox,
  checkboxInputClassName,
  filterCheckboxClassName,
  checkboxToneClass,
  nativeCheckboxClassName,
};
export type { CheckboxTone };
