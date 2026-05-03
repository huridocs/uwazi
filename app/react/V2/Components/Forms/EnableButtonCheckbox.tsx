/* eslint-disable react/no-multi-comp, react/require-default-props */
import React, { CSSProperties, ReactEventHandler, Ref, useState } from 'react';
import { Translate } from '#app/I18N/index.js';

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

type ButtonTone = 'checkedDisabled' | 'checkedHover' | 'checked' | 'disabled' | 'hover' | 'default';

const buttonStyles: Record<ButtonTone, CSSProperties> = {
  checkedDisabled: {
    backgroundColor:
      'color-mix(in srgb, var(--color-theme-feedback-success) 45%, var(--color-theme-surface-raised))',
    borderColor: 'color-mix(in srgb, var(--color-theme-feedback-success) 45%, transparent)',
    color: 'var(--color-theme-text-primary)',
  },
  checkedHover: {
    backgroundColor: 'var(--color-theme-feedback-danger)',
    borderColor: 'var(--color-theme-feedback-danger)',
    color: 'var(--color-theme-feedback-danger-fg)',
  },
  checked: {
    backgroundColor: 'var(--color-theme-feedback-success)',
    borderColor: 'var(--color-theme-feedback-success)',
    color: 'var(--color-theme-feedback-success-fg)',
  },
  disabled: {
    backgroundColor: 'transparent',
    borderColor: 'color-mix(in srgb, var(--color-theme-action-primary) 35%, transparent)',
    color:
      'color-mix(in srgb, var(--color-theme-action-primary) 40%, var(--color-theme-surface-page))',
  },
  hover: {
    backgroundColor: 'var(--color-theme-feedback-success)',
    borderColor: 'var(--color-theme-feedback-success)',
    color: 'var(--color-theme-feedback-success-fg)',
  },
  default: {
    backgroundColor: 'var(--color-theme-surface-raised)',
    borderColor: 'var(--color-theme-action-primary)',
    color: 'var(--color-theme-action-primary)',
  },
};

const getButtonTone = (checked: boolean, disabled: boolean, hovering: boolean): ButtonTone => {
  if (checked && disabled) return 'checkedDisabled';
  if (checked && hovering) return 'checkedHover';
  if (checked) return 'checked';
  if (disabled) return 'disabled';
  if (hovering) return 'hover';
  return 'default';
};

const EnableButtonCheckbox = React.forwardRef(
  (
    { name, onChange, className = '', disabled = false, defaultChecked = false }: CheckboxProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const [hovering, setHovering] = useState(false);
    const [isChecked, setIsChecked] = useState(defaultChecked);
    const buttonStyle = buttonStyles[getButtonTone(isChecked, disabled, hovering)];

    return (
      <label
        data-testid="enable-button-checkbox"
        className={`relative inline-flex text-sm font-medium ${className}`}
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
            onChange?.(event);
          }}
          className="sr-only"
          ref={ref}
        />

        <div
          className={`w-24 truncate rounded-lg border px-1 py-2 text-center text-sm font-medium ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={buttonStyle}
        >
          <Text checked={isChecked} hovering={hovering} disabled={disabled} />
        </div>
      </label>
    );
  }
);

export { EnableButtonCheckbox };
