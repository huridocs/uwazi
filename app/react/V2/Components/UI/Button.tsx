import React, { MouseEventHandler } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'compact'
  | 'success'
  | 'dangerSecondary'
  | 'successSecondary'
  | 'dangerSubtle'
  | 'successSubtle';

interface ButtonProps {
  children: string | React.ReactNode;
  variant?: ButtonVariant;
  type?: 'submit' | 'button';
  size?: 'small' | 'medium';
  disabled?: boolean;
  form?: string;
  onClick?: MouseEventHandler;
  className?: string;
  'data-testid'?: string;
}

const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  size,
  disabled,
  form,
  onClick,
  className = '',
  'data-testid': dataTestid,
}: ButtonProps) => {
  const sizeClasses: Record<
    ButtonVariant,
    Record<NonNullable<ButtonProps['size']> | 'default', string>
  > = {
    primary: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-4 py-2 text-sm',
    },
    secondary: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-4 py-2 text-sm',
    },
    danger: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-4 py-2 text-sm',
    },
    ghost: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-3 py-1.5 text-xs',
      default: 'px-3 py-1.5 text-xs',
    },
    compact: {
      small: 'px-2.5 py-1 text-xs',
      medium: 'px-3 py-1 text-[0.8125rem]',
      default: 'px-3 py-1 text-[0.8125rem]',
    },
    success: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-4 py-2 text-sm',
    },
    dangerSecondary: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-4 py-2 text-sm',
    },
    successSecondary: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-4 py-2 text-sm',
    },
    dangerSubtle: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-3 py-1.5 text-xs',
      default: 'px-3 py-1.5 text-xs',
    },
    successSubtle: {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-3 py-1.5 text-xs',
      default: 'px-3 py-1.5 text-xs',
    },
  };

  const textStyles = size ? sizeClasses[variant][size] : sizeClasses[variant].default;
  const hoverClassByVariant: Record<ButtonVariant, string> = {
    primary: 'enabled:hover:opacity-90',
    secondary:
      'enabled:hover:[background-color:var(--color-theme-button-secondary-hover-bg)] enabled:hover:[border-color:var(--color-theme-button-secondary-border)]',
    danger: 'enabled:hover:opacity-90',
    ghost:
      'enabled:hover:[background-color:var(--color-theme-button-ghost-hover-bg)] enabled:hover:[border-color:var(--color-theme-button-ghost-hover-border)] enabled:hover:[color:var(--color-theme-button-ghost-hover-fg)]',
    compact:
      'enabled:hover:[background-color:var(--color-theme-bg-muted)] enabled:hover:[border-color:var(--color-theme-button-compact-border)]',
    success:
      'enabled:hover:[background-color:var(--color-theme-button-success-hover-bg)] enabled:hover:[border-color:var(--color-theme-button-success-hover-bg)]',
    dangerSecondary:
      'enabled:hover:[background-color:var(--color-theme-button-danger-subtle-bg)] enabled:hover:[border-color:var(--color-theme-button-danger-secondary-border)]',
    successSecondary:
      'enabled:hover:[background-color:var(--color-theme-button-success-subtle-bg)] enabled:hover:[border-color:var(--color-theme-button-success-secondary-border)]',
    dangerSubtle: 'enabled:hover:opacity-90',
    successSubtle: 'enabled:hover:opacity-90',
  };
  const styleByVariant: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      borderColor: disabled
        ? 'var(--color-theme-button-primary-disabled-border)'
        : 'var(--color-theme-button-primary-border)',
      backgroundColor: disabled
        ? 'var(--color-theme-button-primary-disabled-bg)'
        : 'var(--color-theme-button-primary-bg)',
      color: disabled
        ? 'var(--color-theme-button-primary-disabled-fg)'
        : 'var(--color-theme-button-primary-fg)',
    },
    secondary: {
      borderColor: disabled
        ? 'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)'
        : 'var(--color-theme-button-secondary-border)',
      backgroundColor: 'var(--color-theme-button-secondary-bg)',
      color: disabled ? 'var(--color-theme-text-muted)' : 'var(--color-theme-button-secondary-fg)',
    },
    danger: {
      borderColor: 'var(--color-theme-button-danger-border)',
      backgroundColor: 'var(--color-theme-button-danger-bg)',
      color: 'var(--color-theme-button-danger-fg)',
    },
    ghost: {
      borderColor: 'var(--color-theme-button-ghost-border)',
      backgroundColor: 'var(--color-theme-button-ghost-bg)',
      color: disabled ? 'var(--color-theme-text-muted)' : 'var(--color-theme-button-ghost-fg)',
    },
    compact: {
      borderColor: disabled
        ? 'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)'
        : 'var(--color-theme-button-compact-border)',
      backgroundColor: 'var(--color-theme-button-compact-bg)',
      color: disabled ? 'var(--color-theme-text-muted)' : 'var(--color-theme-button-compact-fg)',
    },
    success: {
      borderColor: disabled
        ? 'var(--color-theme-button-success-disabled-border)'
        : 'var(--color-theme-button-success-border)',
      backgroundColor: disabled
        ? 'var(--color-theme-button-success-disabled-bg)'
        : 'var(--color-theme-button-success-bg)',
      color: disabled
        ? 'var(--color-theme-button-success-disabled-fg)'
        : 'var(--color-theme-button-success-fg)',
    },
    dangerSecondary: {
      borderColor: disabled
        ? 'color-mix(in srgb, var(--color-theme-feedback-danger) 15%, transparent)'
        : 'var(--color-theme-button-danger-secondary-border)',
      backgroundColor: 'var(--color-theme-button-danger-secondary-bg)',
      color: disabled
        ? 'var(--color-theme-text-muted)'
        : 'var(--color-theme-button-danger-secondary-fg)',
    },
    successSecondary: {
      borderColor: disabled
        ? 'color-mix(in srgb, var(--color-theme-feedback-success) 15%, transparent)'
        : 'var(--color-theme-button-success-secondary-border)',
      backgroundColor: 'var(--color-theme-button-success-secondary-bg)',
      color: disabled
        ? 'var(--color-theme-text-muted)'
        : 'var(--color-theme-button-success-secondary-fg)',
    },
    dangerSubtle: {
      borderColor: 'var(--color-theme-button-danger-subtle-border)',
      backgroundColor: 'var(--color-theme-button-danger-subtle-bg)',
      color: disabled
        ? 'var(--color-theme-text-muted)'
        : 'var(--color-theme-button-danger-subtle-fg)',
    },
    successSubtle: {
      borderColor: 'var(--color-theme-button-success-subtle-border)',
      backgroundColor: 'var(--color-theme-button-success-subtle-bg)',
      color: disabled
        ? 'var(--color-theme-text-muted)'
        : 'var(--color-theme-button-success-subtle-fg)',
    },
  };

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className={[
        className,
        textStyles,
        'border rounded-md font-medium transition-colors disabled:cursor-not-allowed focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]',
        hoverClassByVariant[variant],
      ]
        .filter(Boolean)
        .join(' ')}
      style={styleByVariant[variant]}
      form={form}
      data-testid={dataTestid}
    >
      {children}
    </button>
  );
};

export { Button };
export type { ButtonProps, ButtonVariant };
