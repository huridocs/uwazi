import React from 'react';

type StatusBadgeTone = 'success' | 'warning' | 'carbon' | 'seal' | 'muted';

type StatusBadgeProps = {
  label: string;
  tone: StatusBadgeTone;
};

const toneClass: Record<StatusBadgeTone, { bg: string; text: string }> = {
  success: {
    bg: 'bg-success-light',
    text: 'text-[color-mix(in_srgb,var(--success)_65%,var(--text-primary))]',
  },
  warning: {
    bg: 'bg-warning-light',
    text: 'text-[color-mix(in_srgb,var(--warning)_65%,var(--text-primary))]',
  },
  carbon: {
    bg: 'bg-carbon-tint',
    text: 'text-[color-mix(in_srgb,var(--accent-blue)_65%,var(--text-primary))]',
  },
  seal: {
    bg: 'bg-seal-tint',
    text: 'text-[color-mix(in_srgb,var(--accent-seal)_65%,var(--text-primary))]',
  },
  muted: { bg: 'bg-warm', text: 'text-ink-tertiary' },
};

const StatusBadge = ({ label, tone }: StatusBadgeProps) => {
  const { bg, text } = toneClass[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold ${bg} ${text}`}
    >
      {label}
    </span>
  );
};

export { StatusBadge };
export type { StatusBadgeProps, StatusBadgeTone };
