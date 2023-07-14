import React from 'react';
import { CustomIconProps } from './types';

const PreviewPropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="2 2 20 20"
  >
    <g stroke="#4b5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m19 3h-14a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-14a2 2 0 0 0 -2-2z" />
      <path d="m9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 4-3.086-3.086a2 2 0 0 0 -2.828 0l-9.086 9.086" />
    </g>
  </svg>
);

export { PreviewPropertyIcon };
