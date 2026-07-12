import React, { MouseEventHandler } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'compact'
  | 'warm'
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
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-3 py-1.5 text-xs',
    },
    secondary: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-3 py-1.5 text-xs',
    },
    danger: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-3 py-1.5 text-xs',
    },
    ghost: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-3 py-1.5 text-xs',
      default: 'px-3 py-1.5 text-xs',
    },
    compact: {
      small: 'px-2 py-1 text-xs',
      medium: 'px-3 py-1 text-[0.8125rem]',
      default: 'px-3 py-1 text-[0.8125rem]',
    },
    warm: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-3 py-1.5 text-xs gap-1.5',
    },
    success: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-3 py-1.5 text-xs',
    },
    dangerSecondary: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-3 py-1.5 text-xs',
    },
    successSecondary: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      default: 'px-3 py-1.5 text-xs',
    },
    dangerSubtle: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-3 py-1.5 text-xs',
      default: 'px-3 py-1.5 text-xs',
    },
    successSubtle: {
      small: 'px-2 py-1.5 text-xs',
      medium: 'px-3 py-1.5 text-xs',
      default: 'px-3 py-1.5 text-xs',
    },
  };

  const textStyles = size ? sizeClasses[variant][size] : sizeClasses[variant].default;

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'border-ink bg-ink text-parchment enabled:hover:opacity-90 disabled:border-[color-mix(in_srgb,var(--color-theme-action-primary)_45%,transparent)]! disabled:bg-[color-mix(in_srgb,var(--color-theme-action-primary)_45%,var(--color-theme-bg-surface))]! disabled:text-ink!',
    secondary:
      'border-border bg-paper text-ink enabled:hover:bg-warm disabled:border-border-soft disabled:bg-paper disabled:text-ink-muted',
    danger:
      'border-emphasis bg-emphasis text-(--color-theme-feedback-danger-fg) enabled:hover:opacity-90 disabled:opacity-60',
    ghost:
      'border-border bg-paper text-ink enabled:hover:bg-warm disabled:border-border-soft disabled:bg-paper disabled:text-ink-muted disabled:opacity-60',
    compact:
      'border-border-soft bg-warm text-ink-secondary enabled:hover:bg-vellum enabled:hover:border-border disabled:border-border-soft disabled:text-ink-muted',
    warm:
      'bg-warm text-ink-secondary enabled:hover:bg-parchment enabled:hover:text-ink disabled:bg-vellum disabled:text-ink-muted',
    success:
      'border-success bg-success text-(--color-theme-feedback-success-fg) enabled:hover:bg-[color-mix(in_srgb,var(--color-theme-success)_92%,black)]! enabled:hover:border-[color-mix(in_srgb,var(--color-theme-success)_92%,black)]! disabled:opacity-60',
    dangerSecondary:
      'border-emphasis bg-transparent text-emphasis enabled:hover:bg-emphasis-tint disabled:border-border-soft disabled:text-ink-muted',
    successSecondary:
      'border-success bg-transparent text-success enabled:hover:bg-success-light disabled:border-border-soft disabled:text-ink-muted',
    dangerSubtle:
      'border-transparent bg-emphasis-tint text-emphasis enabled:hover:opacity-90 disabled:text-ink-muted',
    successSubtle:
      'border-transparent bg-success-light text-success enabled:hover:opacity-90 disabled:text-ink-muted',
  };

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className={[
        className,
        textStyles,
        variant === 'warm'
          ? 'border-0 rounded-lg font-medium transition-colors disabled:cursor-not-allowed focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]'
          : 'border rounded-md font-medium transition-colors disabled:cursor-not-allowed focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]',
        variantClasses[variant],
      ]
        .filter(Boolean)
        .join(' ')}
      form={form}
      data-testid={dataTestid}
    >
      {children}
    </button>
  );
};

export { Button };
export type { ButtonProps, ButtonVariant };
