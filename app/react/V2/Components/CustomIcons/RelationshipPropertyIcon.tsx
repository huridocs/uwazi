import React from 'react';
import { CustomIconProps } from './types';

const RelationshipPropertyIcon = ({ className }: CustomIconProps) => (
  <svg
    className={className || ''}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="3 2 18 20"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"
    />
  </svg>
);

export { RelationshipPropertyIcon };
