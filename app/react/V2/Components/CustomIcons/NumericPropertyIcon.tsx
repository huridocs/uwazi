import React from 'react';
import { CustomIconProps } from './types';

const NumericPropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="3 2 18 20"
  >
    <path
      stroke="#4B5563"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"
    />
  </svg>
);

export { NumericPropertyIcon };
