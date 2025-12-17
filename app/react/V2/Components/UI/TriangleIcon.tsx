import React from 'react';

type TriangleIconProps = {
  isExpanded: boolean;
  className?: string;
};

// Simple triangle icon component - right-pointing when collapsed, down-pointing when expanded
const TriangleIcon = ({ isExpanded, className = '' }: TriangleIconProps) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 8 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transformOrigin: 'center' }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 0.938834C0 0.225764 0.7645 -0.226256 1.3893 0.117384L7.15959 3.29104C7.8072 3.64722 7.8072 4.57776 7.15959 4.93394L1.3893 8.1076C0.7645 8.45129 0 7.99921 0 7.28615V0.938834Z"
      fill="currentColor"
    />
  </svg>
);

export { TriangleIcon };
export type { TriangleIconProps };
