import React from 'react';
import { CustomIconProps } from './types';

const TextPropertyIcon = ({ className }: CustomIconProps) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="2 6 20 10"
  >
    <path
      d="m3 15 4-8 4 8m-7-2h6m8 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm3-6v6"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export { TextPropertyIcon };
