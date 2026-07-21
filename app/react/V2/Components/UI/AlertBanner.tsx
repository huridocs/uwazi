import React, { type ReactNode } from 'react';
import { ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type AlertBannerVariant = 'warning' | 'error';

type AlertBannerProps = {
  variant: AlertBannerVariant;
  children: ReactNode;
};

const variantClass: Record<
  AlertBannerVariant,
  { shell: string; text: string; Icon: typeof ExclamationTriangleIcon }
> = {
  warning: {
    shell: 'bg-warning-light',
    text: 'text-[color-mix(in_srgb,var(--warning)_65%,var(--text-primary))]',
    Icon: ExclamationTriangleIcon,
  },
  error: {
    shell: 'bg-seal-tint',
    text: 'text-[color-mix(in_srgb,var(--accent-seal)_65%,var(--text-primary))]',
    Icon: ExclamationCircleIcon,
  },
};

const AlertBanner = ({ variant, children }: AlertBannerProps) => {
  const { shell, text, Icon } = variantClass[variant];

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${shell} ${text}`}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
    </div>
  );
};

export { AlertBanner };
export type { AlertBannerProps, AlertBannerVariant };
