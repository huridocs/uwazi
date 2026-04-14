import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'gray' | 'primary' | 'success' | 'error' | 'warning';
  className?: string;
}

const getColor = (color: 'gray' | 'primary' | 'success' | 'error' | 'warning') => {
  switch (color) {
    case 'gray':
      return 'var(--color-theme-text-muted)';
    case 'primary':
      return 'var(--color-theme-action-primary)';
    case 'success':
      return 'var(--color-theme-feedback-success)';
    case 'error':
      return 'var(--color-theme-feedback-danger)';
    case 'warning':
      return 'var(--color-theme-feedback-warning)';
    default:
      return 'var(--color-theme-text-muted)';
  }
};

export const ProgressBar = ({ progress, color = 'gray', className = '' }: ProgressBarProps) => (
  <div
    className={`h-2.5 w-full rounded-full ${className}`}
    style={{ backgroundColor: 'var(--color-theme-surface-warm)' }}
  >
    <div
      className="h-2.5 rounded-full"
      style={{ width: `${progress}%`, backgroundColor: getColor(color) }}
    />
  </div>
);

export type { ProgressBarProps };
