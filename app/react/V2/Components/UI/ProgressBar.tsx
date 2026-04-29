import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'gray' | 'primary' | 'success' | 'error' | 'warning';
  className?: string;
  ariaLabelledby?: string;
  ariaValueText?: string;
}

const fillClass: Record<NonNullable<ProgressBarProps['color']>, string> = {
  gray: '[background-color:var(--color-theme-text-muted)]',
  primary: '[background-color:var(--color-theme-action-primary)]',
  success: '[background-color:var(--color-theme-feedback-success)]',
  error: '[background-color:var(--color-theme-feedback-danger)]',
  warning: '[background-color:var(--color-theme-feedback-warning)]',
};

const trackClass =
  'h-2.5 w-full rounded-full [background-color:color-mix(in_srgb,var(--color-theme-border-default,var(--color-theme-border-primary))_60%,transparent)]';

export const ProgressBar = ({
  progress,
  color = 'gray',
  className = '',
  ariaLabelledby,
  ariaValueText,
}: ProgressBarProps) => {
  const boundedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={`${trackClass} ${className}`}
      role="progressbar"
      aria-labelledby={ariaLabelledby}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(boundedProgress)}
      aria-valuetext={ariaValueText}
    >
      <div
        className={`h-2.5 rounded-full ${fillClass[color]}`}
        style={{ width: `${boundedProgress}%` }}
      />
    </div>
  );
};
export type { ProgressBarProps };
