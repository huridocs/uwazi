/* eslint-disable react/no-multi-comp */
import React, { ReactEventHandler, Ref, useState } from 'react';
import { Translate } from 'app/I18N';

interface CheckboxProps {
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  defaultChecked?: boolean;
  className?: string;
  disabled?: boolean;
}

const Text = ({
  checked,
  disabled,
  hovering,
}: {
  checked: boolean | undefined;
  disabled: boolean | undefined;
  hovering: boolean;
}) => {
  switch (true) {
    case checked && hovering && !disabled:
      return <Translate>Disable</Translate>;

    case checked && disabled:
      return <Translate>Activated</Translate>;

    case checked && !hovering:
      return <Translate>Activated</Translate>;

    default:
      return <Translate>Activate</Translate>;
  }
};

const EnableButtonCheckbox = React.forwardRef(
  (
    { name, onChange, className, disabled, defaultChecked }: CheckboxProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const [hovering, setHovering] = useState(false);
    const [isChecked, setIsChecked] = useState<boolean>(defaultChecked || false);

    let styles;

    switch (true) {
      case isChecked && disabled:
        styles = 'bg-success-300 border-success-300 text-white hover:cursor-not-allowed';
        break;

      case !isChecked && disabled:
        styles = 'text-primary-300 border-primary-300 hover:cursor-not-allowed';
        break;

      case isChecked && !disabled:
        styles =
          'bg-success-700 border-success-700 text-white hover:cursor-pointer hover:bg-error-700 hover:border-error-700';
        break;

      default:
        styles = 'text-primary-700 border-primary-700 bg-white hover:cursor-pointer';
        break;
    }

    return (
      <label
        data-testid="enable-button-checkbox"
        className={`inline-flex relative text-sm font-medium ${className}`}
        onMouseEnter={() => {
          setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
        }}
      >
        <input
          type="checkbox"
          disabled={disabled}
          defaultChecked={defaultChecked}
          name={name}
          onChange={event => {
            setIsChecked(event.target.checked);

            if (onChange) {
              onChange(event);
            }
          }}
          className="sr-only"
          ref={ref}
        />

        <div
          className={`px-1 py-2 w-24 text-sm font-medium text-center truncate rounded-lg border ${styles}`}
        >
          <Text checked={isChecked} hovering={hovering} disabled={disabled} />
        </div>
      </label>
    );
  }
);

export { EnableButtonCheckbox };
