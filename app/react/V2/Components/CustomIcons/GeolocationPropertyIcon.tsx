import React from 'react';
import { CustomIconProps } from './types';

const GeolocationPropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="3 1 18 22"
  >
    <g stroke="#4b5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" />
      <path d="m12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </g>
  </svg>
);

export { GeolocationPropertyIcon };
