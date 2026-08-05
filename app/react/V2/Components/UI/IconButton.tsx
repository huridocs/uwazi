import React, { type MouseEventHandler, type ReactNode } from 'react';

type IconButtonVariant = 'ghost' | 'danger' | 'subtle' | 'clear' | 'chip' | 'drawer';

type IconButtonProps = {
  children: ReactNode;
  'aria-label': string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  ariaExpanded?: boolean;
  variant?: IconButtonVariant;
  showOnGroupHover?: boolean;
};

const variantClass: Record<IconButtonVariant, string> = {
  ghost: 'rounded p-1 text-ink-muted hover:bg-warm hover:text-ink',
  danger: 'rounded p-1 text-ink-muted hover:bg-emphasis-tint hover:text-emphasis',
  subtle: 'shrink-0 rounded-full p-0.5 text-ink-muted transition-colors hover:text-ink',
  clear:
    'shrink-0 rounded-full p-0.5 text-ink-muted transition-colors hover:bg-parchment hover:text-ink',
  chip: 'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-ink-tertiary hover:text-ink',
  drawer:
    'flex h-5 w-5 items-center justify-center rounded-sm text-ink-tertiary transition-colors hover:text-ink',
};

const IconButton = ({
  children,
  'aria-label': ariaLabel,
  onClick,
  ariaExpanded,
  variant = 'ghost',
  showOnGroupHover = false,
}: IconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    className={[
      'cursor-pointer',
      variantClass[variant],
      showOnGroupHover ? 'opacity-0 transition-all group-hover:opacity-100' : '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </button>
);

export type { IconButtonVariant };
export { IconButton };
