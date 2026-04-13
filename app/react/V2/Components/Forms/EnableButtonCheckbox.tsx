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
    const backgroundColor = isChecked
      ? disabled
        ? 'color-mix(in srgb, var(--color-theme-feedback-success) 45%, var(--color-theme-surface-raised))'
        : hovering && isInteractive
          ? hoverColor
          : 'var(--color-theme-feedback-success)'
      : disabled
        ? 'transparent'
        : hovering && isInteractive
          ? hoverColor
          : 'var(--color-theme-surface-raised)';
    const borderColor = isChecked
      ? disabled
        ? 'color-mix(in srgb, var(--color-theme-feedback-success) 45%, transparent)'
        : hovering && isInteractive
          ? hoverColor
          : 'var(--color-theme-feedback-success)'
      : disabled
        ? 'color-mix(in srgb, var(--color-theme-action-primary) 35%, transparent)'
        : hovering && isInteractive
          ? hoverColor
          : 'var(--color-theme-action-primary)';
    const textColor = isChecked
      ? 'var(--color-theme-text-on-solid)'
      : disabled
        ? 'color-mix(in srgb, var(--color-theme-action-primary) 40%, var(--color-theme-surface-page))'
        : hovering && isInteractive
          ? 'var(--color-theme-text-on-solid)'
          : 'var(--color-theme-action-primary)';

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
