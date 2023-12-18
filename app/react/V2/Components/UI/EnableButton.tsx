import React, { ReactEventHandler, Ref } from 'react';
import { Translate } from 'app/I18N';

interface EnableButtonProps {
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  checked?: boolean;
  className?: string;
  disabled?: boolean;
}

const EnableButton = React.forwardRef(
  (
    { name, onChange, disabled = false, checked = false, className }: EnableButtonProps,
    ref: Ref<any>
  ) => {
    const styles = disabled
      ? 'text-primary-300 border-primary-300 peer-checked:text-white peer-checked:border-success-200 peer-checked:bg-success-200'
      : 'text-primary-700 border-primary-700 peer-checked:text-white peer-checked:border-success-400 peer-checked:bg-success-400';
    return (
      <label
        className={`relative inline-flex items-center mb-5 text-sm font-medium text-gray-900 cursor-pointer ${
          disabled ? '!text-gray-300' : ''
        } ${className} `}
      >
        <input
          type="checkbox"
          disabled={disabled}
          checked={checked}
          name={name}
          ref={ref}
          className="sr-only peer"
          onChange={onChange}
        />
        <div
          className={`bg-white peer ${styles} text-sm px-5 py-2.5 peer-disabled:cursor-not-allowed font-medium rounded-lg
        border focus:outline-none`}
        >
          <Translate>{checked ? 'Active' : 'Enable'}</Translate>
        </div>
      </label>
    );
  }
);

export { EnableButton };
