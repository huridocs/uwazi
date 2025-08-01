import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'gray' | 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  className?: string;
}

const getColor = (color: 'gray' | 'primary' | 'secondary' | 'success' | 'error' | 'warning') => {
  switch (color) {
    case 'gray':
      return 'bg-gray-600';
    case 'primary':
      return 'bg-primary-600';
    case 'secondary':
      return 'bg-secondary-600';
    case 'success':
      return 'bg-success-600';
    case 'error':
      return 'bg-error-600';
    case 'warning':
      return 'bg-warning-600';
    default:
      return 'bg-gray-600';
  }
};

export const ProgressBar = ({ progress, color = 'gray', className = '' }: ProgressBarProps) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div className={`h-2.5 rounded-full ${getColor(color)}`} style={{ width: `${progress}%` }} />
  </div>
);
