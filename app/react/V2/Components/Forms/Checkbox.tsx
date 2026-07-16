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

const checkboxInputBase =
  'h-3.5 w-3.5 shrink-0 cursor-pointer rounded disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-carbon/30';

const checkboxToneClass: Record<CheckboxTone, string> = {
  ink: cx(checkboxInputBase, 'accent-ink'),
  carbon: cx(checkboxInputBase, 'accent-carbon'),
};

const checkboxInputClassName = checkboxToneClass.ink;
const filterCheckboxClassName = checkboxToneClass.carbon;

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
      <fieldset className={cx('flex items-center gap-1.5 border-0 p-0 m-0', className)}>
        <input
          type="checkbox"
          checked={checked}
          id={name}
          name={name}
          disabled={disabled}
          onChange={onChange}
          ref={inputRef}
          className={checkboxToneClass[tone]}
        />
        <label
          htmlFor={name}
          className={cx(
            'flex cursor-pointer items-center gap-1.5 text-xs text-ink-secondary',
            disabled && 'cursor-not-allowed text-ink-muted'
          )}
        >
          {isString(label) ? <Translate>{label}</Translate> : label}
        </label>
      </fieldset>
    );
  }
);

export { Checkbox, checkboxInputClassName, filterCheckboxClassName, checkboxToneClass };
export type { CheckboxTone };
