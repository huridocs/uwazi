import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'gray' | 'primary' | 'success' | 'error' | 'warning';
  className?: string;
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

export const ProgressBar = ({ progress, color = 'gray', className = '' }: ProgressBarProps) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div className={`h-2.5 rounded-full ${getColor(color)}`} style={{ width: `${progress}%` }} />
  </div>
);
