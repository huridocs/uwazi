import React from 'react';
import { CustomIconProps } from './types';

const IDPropertyIcon = ({ className }: CustomIconProps) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="1 1 21.93 22"
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m2 12c0-5.5 4.5-10 10-10a10 10 0 0 1 8 4" />
      <path d="m5 19.5c.5-1.5 1-4.5 1-7.5 0-.7.12-1.37.34-2m10.95 11.02c.12-.6.43-2.3.5-3.02m-5.79-8a2 2 0 0 0 -2 2c0 1.02-.1 2.51-.26 4m-1.09 6c.21-.66.45-1.32.57-2m4.78-6.88c0 2.38 0 6.38-1 8.88m-11-6h.01m19.79 0c.2-2 .13-5.354 0-6m-12.8-3.2a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
    </g>
  </svg>
);

export { IDPropertyIcon };
