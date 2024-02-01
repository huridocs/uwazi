import React, { ReactEventHandler, Ref } from 'react';
import { Translate } from 'app/I18N';

interface CheckboxProps {
  name: string;
  toggleTexts?: [React.ReactNode, React.ReactNode];
  checked?: boolean;
  defaultChecked?: boolean;
  className?: string;
  disabled?: boolean;
  onChange?: ReactEventHandler<HTMLInputElement>;
}

const EnableButtonCheckbox = React.forwardRef(
  (
    { name, toggleTexts, checked, defaultChecked, className, disabled, onChange }: CheckboxProps,
    ref: Ref<any>
  ) => {
    const styles = disabled
      ? 'text-primary-300 border-primary-300 peer-checked:border-success-200 peer-checked:bg-success-200'
      : 'text-primary-700 border-primary-700 peer-checked:border-success-400 peer-checked:bg-success-400';

    return (
      <label
        data-testid="enable-button-checkbox"
        className={`relative inline-flex items-center text-sm font-medium text-gray-900 cursor-pointer ${
          disabled ? '!text-gray-300' : ''
        } ${className}`}
      >
        <input
          type="checkbox"
          disabled={disabled}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          ref={ref}
          className="sr-only peer"
          onChange={onChange}
        />

        <div
          className={`px-3 py-2 text-sm font-medium bg-white rounded-lg border peer ${styles} peer-checked:text-white peer-disabled:cursor-not-allowed focus:outline-none`}
        >
          {toggleTexts && toggleTexts.length === 2 ? (
            <>{checked ? toggleTexts[0] : toggleTexts[1]}</>
          ) : (
            <Translate>{checked ? 'Active' : 'Enable'}</Translate>
          )}
        </div>
      </label>
    );
  }
);

export { EnableButtonCheckbox };
