import React, { MouseEventHandler } from 'react';

interface ButtonProps {
  children: string | React.ReactNode;
  type?: 'submit' | 'button';
  color?: 'orange' | 'green' | 'red' | 'indigo' | 'white';
  disabled?: boolean;
  form?: string;
  onClick?: MouseEventHandler;
  className?: string;
  icon?: React.ReactNode;
  collapsed?: boolean;
}

const EmbededButton = ({
  color = 'white',
  children,
  type = 'button',
  disabled,
  form,
  onClick,
  icon,
  collapsed,
  className = '',
}: ButtonProps) => {
  const palette: Record<NonNullable<ButtonProps['color']>, React.CSSProperties> = {
    orange: {
      borderColor: 'var(--color-theme-button-embedded-orange-border)',
      backgroundColor: 'var(--color-theme-button-embedded-orange-bg)',
      color: 'var(--color-theme-button-embedded-orange-fg)',
    },
    green: {
      borderColor: disabled
        ? 'var(--color-theme-button-embedded-green-disabled-border)'
        : 'var(--color-theme-button-embedded-green-border)',
      backgroundColor: disabled
        ? 'var(--color-theme-button-embedded-green-disabled-bg)'
        : 'var(--color-theme-button-embedded-green-bg)',
      color: disabled
        ? 'var(--color-theme-button-embedded-green-disabled-fg)'
        : 'var(--color-theme-button-embedded-green-fg)',
    },
    red: {
      borderColor: 'var(--color-theme-button-embedded-red-border)',
      backgroundColor: 'var(--color-theme-button-embedded-red-bg)',
      color: 'var(--color-theme-button-embedded-red-fg)',
    },
    indigo: {
      borderColor: disabled
        ? 'var(--color-theme-button-embedded-indigo-disabled-border)'
        : 'var(--color-theme-button-embedded-indigo-border)',
      backgroundColor: disabled
        ? 'var(--color-theme-button-embedded-indigo-disabled-bg)'
        : 'var(--color-theme-button-embedded-indigo-bg)',
      color: disabled
        ? 'var(--color-theme-button-embedded-indigo-disabled-fg)'
        : 'var(--color-theme-button-embedded-indigo-fg)',
    },
    white: {
      borderColor: 'var(--color-theme-button-embedded-white-border)',
      backgroundColor: disabled
        ? 'var(--color-theme-button-embedded-white-disabled-bg)'
        : 'var(--color-theme-button-embedded-white-bg)',
      color: disabled
        ? 'var(--color-theme-button-embedded-white-disabled-fg)'
        : 'var(--color-theme-button-embedded-white-fg)',
    },
  };

  if (collapsed) {
    return (
      <button
        type={type === 'submit' ? 'submit' : 'button'}
        onClick={onClick}
        disabled={disabled}
        className={`${className} px-2 py-[2px] text-xs disabled:cursor-not-allowed font-medium rounded-[4px] focus:outline-hidden`}
        style={palette[color]}
        form={form}
      >
        <div className="flex flex-row gap-1 justify-center items-center">
          <div className="w-3 h-3 text-sm">{icon}</div>
          <div className="sr-only">{children}</div>
        </div>
      </button>
    );
  }

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${disabled ? '' : 'border'} px-2 py-[2px] text-xs disabled:cursor-not-allowed font-medium rounded-[4px] focus:outline-hidden`}
      style={palette[color]}
      form={form}
    >
      <div className="flex flex-row gap-1 justify-center items-center">
        <div className="w-3 h-3 text-sm">{icon}</div>
        <div className="text-sm">{children}</div>
      </div>
    </button>
  );
};

export { EmbededButton };
