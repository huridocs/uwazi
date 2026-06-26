import React from 'react';
import type { ChartIconProps } from './ChartIconProps.js';

const LineChartIcon = ({ className }: ChartIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 16L9 11L13 14L20 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="4" cy="16" r="1.5" fill="currentColor" />
    <circle cx="9" cy="11" r="1.5" fill="currentColor" />
    <circle cx="13" cy="14" r="1.5" fill="currentColor" />
    <circle cx="20" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

export { LineChartIcon };
