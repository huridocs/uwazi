import React from 'react';
import { CustomIconProps } from './types';

const SelectPropertyIcon = ({ className }: CustomIconProps) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="6 3 12 18"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m7 15 5 5 5-5M7 9l5-5 5 5"
    />
  </svg>
);

export { SelectPropertyIcon };
