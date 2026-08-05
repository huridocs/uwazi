import React from 'react';
import type { ChartIconProps } from './ChartIconProps.js';

const AreaChartIcon = ({ className }: ChartIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M4 18L8 12L12 14L20 6V18H4Z" fill="currentColor" opacity="0.3" />
    <path d="M4 18L8 12L12 14L20 6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export { AreaChartIcon };
