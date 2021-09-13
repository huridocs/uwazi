import React from 'react';
import { t } from 'app/I18N';

export interface SwitcherProps {
  onChange: (checked: boolean) => {};
  value: boolean;
  prefix: string;
}

const Switcher = (props: SwitcherProps) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange(e.target.checked);
  };

  return (
    <div className="switcher-wrapper">
      <span className={props.value ? 'is-active' : ''}>{t('System', 'Filters AND operator')}</span>
      <input
        id={`${props.prefix}switcher`}
        type="checkbox"
        checked={props.value || false}
        onChange={onChange}
      />
      <label htmlFor={`${props.prefix}switcher`} className="switcher" />
      <span className={props.value ? '' : 'is-active'}>{t('System', 'Filters OR operator')}</span>
    </div>
  );
};

export default Switcher;
