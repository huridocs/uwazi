import React from 'react';
import { CustomIconProps } from './types';

const MediaPropertyIcon = ({ className }: CustomIconProps) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="3 1 18 22"
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m14.5 2h-8.5a2 2 0 0 0 -2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-12.5z" />
      <path d="m14 2v6h6m-10 3 5 3-5 3z" />
    </g>
  </svg>
);

export { MediaPropertyIcon };
