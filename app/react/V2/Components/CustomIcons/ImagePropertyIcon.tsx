import React from 'react';
import { CustomIconProps } from './types';

const ImagePropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="3 1 18 22"
  >
    <g stroke="#4b5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m14.5 2h-8.5a2 2 0 0 0 -2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-12.5z" />
      <path d="m14 2v6h6m-10 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 2-1.09-1.09a2 2 0 0 0 -2.82 0l-6.09 6.09" />
    </g>
  </svg>
);

export { ImagePropertyIcon };
