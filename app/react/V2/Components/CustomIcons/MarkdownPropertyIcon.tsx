import React from 'react';
import { CustomIconProps } from './types';

const MarkdownPropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="1 2 22 20"
  >
    <g stroke="#4b5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m8 21h12a2 2 0 0 0 2-2v-2h-12v2a2 2 0 0 1 -2 2zm0 0a2 2 0 0 1 -2-2v-14a2 2 0 1 0 -4 0v3h4" />
      <path d="m19 17v-12a2 2 0 0 0 -2-2h-13m11 5h-5m5 4h-5" />
    </g>
  </svg>
);

export { MarkdownPropertyIcon };
