import React from 'react';
import { Translate } from 'app/I18N';

export interface SwitcherProps {
  onChange: (checked: boolean) => {};
  value: boolean;
  prefix: string;
  leftLabel?: string;
  rightLabel?: string;
}

const Switcher = ({
  onChange,
  value,
  prefix,
  leftLabel = 'Filters AND operator',
  rightLabel = 'Filters OR operator',
}: SwitcherProps) => {
  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="switcher-wrapper">
      <span className={value ? 'is-active' : ''}>
        <Translate>{leftLabel}</Translate>
      </span>
      <input
        id={`${prefix}switcher`}
        type="checkbox"
        checked={value || false}
        onChange={onChangeHandler}
      />
      <label htmlFor={`${prefix}switcher`} className="switcher" />
      <span className={value ? '' : 'is-active'}>
        <Translate>{rightLabel}</Translate>
      </span>
    </div>
  );
};

export { Switcher };
