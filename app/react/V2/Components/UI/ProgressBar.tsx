import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'gray' | 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  className?: string;
}

export const ProgressBar = ({ progress, color = 'gray', className }: ProgressBarProps) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700 ${className}`}>
    <div
      className={`h-2.5 rounded-full dark:bg-gray-300 bg-${color}-600`}
      style={{ width: `${progress}%` }}
    />
  </div>
);
