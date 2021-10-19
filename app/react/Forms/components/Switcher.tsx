import React from 'react';
import { Translate } from 'app/I18N';

export interface SwitcherProps {
  onChange: (checked: boolean) => {};
  value: boolean;
  prefix: string;
  leftLabel?: JSX.Element | string;
  rightLabel?: JSX.Element | string;
}

const Switcher = ({
  onChange,
  value,
  prefix,
  leftLabel = <Translate translationKey="Filters AND operator">AND</Translate>,
  rightLabel = <Translate translationKey="Filters OR operator">OR</Translate>,
}: SwitcherProps) => {
  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="switcher-wrapper">
      <span className={value ? 'is-active' : ''}>{leftLabel}</span>
      <input
        id={`${prefix}switcher`}
        type="checkbox"
        checked={value || false}
        onChange={onChangeHandler}
      />
      <label htmlFor={`${prefix}switcher`} className="switcher" />
      <span className={value ? '' : 'is-active'}>{rightLabel}</span>
    </div>
  );
};

export { Switcher };
