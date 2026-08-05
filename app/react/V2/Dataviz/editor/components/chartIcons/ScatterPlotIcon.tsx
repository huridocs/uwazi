import React from 'react';
import type { ChartIconProps } from './ChartIconProps.js';

const ScatterPlotIcon = ({ className }: ChartIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="6" cy="17" r="2" fill="currentColor" />
    <circle cx="10" cy="11" r="2" fill="currentColor" />
    <circle cx="15" cy="14" r="2" fill="currentColor" />
    <circle cx="19" cy="7" r="2" fill="currentColor" />
  </svg>
);

export { ScatterPlotIcon };
