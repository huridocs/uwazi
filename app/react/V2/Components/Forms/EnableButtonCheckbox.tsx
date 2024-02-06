import React, { ReactEventHandler, Ref } from 'react';
import { Translate } from 'app/I18N';

interface CheckboxProps {
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  checked?: boolean;
  defaultChecked?: boolean;
  className?: string;
  disabled?: boolean;
}

const EnableButtonCheckbox = React.forwardRef(
  (
    { name, onChange, className, disabled, checked, defaultChecked }: CheckboxProps,
    ref: Ref<any>
  ) => {
    const styles = disabled
      ? 'text-primary-300 border-primary-300 peer-checked:border-success-200 peer-checked:bg-success-200'
      : 'text-primary-700 border-primary-700 peer-checked:border-success-700 peer-checked:bg-success-700';

    return (
      <label
        data-testid="enable-button-checkbox"
        className={`relative inline-flex items-center text-sm  text-gray-900 cursor-pointer ${
          disabled ? '!text-gray-300' : ''
        } ${className} `}
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
          className={`bg-white peer ${styles} peer-checked:text-white text-sm px-3 py-2 peer-disabled:cursor-not-allowed font-semibold rounded-lg
    border focus:outline-none`}
        >
          <Translate>{checked ? 'Active' : 'Enable'}</Translate>
        </div>
      </label>
    );
  }
);

export { EnableButtonCheckbox };
