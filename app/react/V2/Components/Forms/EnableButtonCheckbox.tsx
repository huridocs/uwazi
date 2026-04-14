/* eslint-disable react/no-multi-comp */
import React, { ReactEventHandler, Ref, useState } from 'react';
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

const EnableButtonCheckbox = React.forwardRef(
  (
    { name, onChange, className, disabled, defaultChecked }: CheckboxProps,
    ref: Ref<HTMLInputElement>
  ) => {
    const [hovering, setHovering] = useState(false);
    const [isChecked, setIsChecked] = useState<boolean>(defaultChecked || false);
    const isInteractive = !disabled;
    const hoverColor = isChecked
      ? 'var(--color-theme-feedback-danger)'
      : 'var(--color-theme-feedback-success)';

    let backgroundColor: string;
    if (isChecked) {
      if (disabled) {
        backgroundColor =
          'color-mix(in srgb, var(--color-theme-feedback-success) 45%, var(--color-theme-surface-raised))';
      } else if (hovering && isInteractive) {
        backgroundColor = hoverColor;
      } else {
        backgroundColor = 'var(--color-theme-feedback-success)';
      }
    } else if (disabled) {
      backgroundColor = 'transparent';
    } else if (hovering && isInteractive) {
      backgroundColor = hoverColor;
    } else {
      backgroundColor = 'var(--color-theme-surface-raised)';
    }

    let borderColor: string;
    if (isChecked) {
      if (disabled) {
        borderColor = 'color-mix(in srgb, var(--color-theme-feedback-success) 45%, transparent)';
      } else if (hovering && isInteractive) {
        borderColor = hoverColor;
      } else {
        borderColor = 'var(--color-theme-feedback-success)';
      }
    } else if (disabled) {
      borderColor = 'color-mix(in srgb, var(--color-theme-action-primary) 35%, transparent)';
    } else if (hovering && isInteractive) {
      borderColor = hoverColor;
    } else {
      borderColor = 'var(--color-theme-action-primary)';
    }

    let textColor: string;
    if (isChecked) {
      textColor = 'var(--color-theme-text-on-solid)';
    } else if (disabled) {
      textColor =
        'color-mix(in srgb, var(--color-theme-action-primary) 40%, var(--color-theme-surface-page))';
    } else if (hovering && isInteractive) {
      textColor = 'var(--color-theme-text-on-solid)';
    } else {
      textColor = 'var(--color-theme-action-primary)';
    }

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

            if (onChange) {
              onChange(event);
            }
          }}
          className="sr-only"
          ref={ref}
        />

        <div
          className={`w-24 truncate rounded-lg border px-1 py-2 text-center text-sm font-medium ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{ backgroundColor, borderColor, color: textColor }}
        >
          <Text checked={isChecked} hovering={hovering} disabled={disabled} />
        </div>
      </label>
    );
  }
);

export { EnableButtonCheckbox };
