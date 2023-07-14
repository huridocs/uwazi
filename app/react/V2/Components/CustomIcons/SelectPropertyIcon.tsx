import React from 'react';
import { CustomIconProps } from './types';

const SelectPropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="6 3 12 18"
  >
    <path
      stroke="#4B5563"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m7 15 5 5 5-5M7 9l5-5 5 5"
    />
  </svg>
);

export { SelectPropertyIcon };
