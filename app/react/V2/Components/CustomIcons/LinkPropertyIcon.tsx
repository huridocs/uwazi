import React from 'react';
import { CustomIconProps } from './types';

const LinkPropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="1.06 1.07 21.89 21.87"
  >
    <g stroke="#4b5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m10 13a5.001 5.001 0 0 0 7.54.54l3-3a5 5 0 0 0 -7.07-7.07l-1.72 1.71" />
      <path d="m14 11a5.001 5.001 0 0 0 -7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </g>
  </svg>
);

export { LinkPropertyIcon };
