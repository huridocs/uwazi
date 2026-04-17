import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'gray' | 'primary' | 'success' | 'error' | 'warning';
  className?: string;
  ariaLabelledby?: string;
  ariaValueText?: string;
}

const getColor = (color: 'gray' | 'primary' | 'success' | 'error' | 'warning') => {
  switch (color) {
    case 'gray':
      return 'bg-gray-500';
    case 'primary':
      return 'bg-primary-500';
    case 'success':
      return 'bg-success-500';
    case 'error':
      return 'bg-error-500';
    case 'warning':
      return 'bg-warning-500';
    default:
      return 'bg-gray-500';
  }
};

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
      className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}
      role="progressbar"
      aria-labelledby={ariaLabelledby}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(boundedProgress)}
      aria-valuetext={ariaValueText}
    >
      <div className={`h-2.5 rounded-full ${getColor(color)}`} style={{ width: `${boundedProgress}%` }} />
    </div>
  );
};
