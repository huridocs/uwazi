import React from 'react';
import type { ChartIconProps } from './ChartIconProps.js';

const CELLS: { x: number; y: number; opacity: number }[] = [
  { x: 3, y: 3, opacity: 0.25 },
  { x: 9, y: 3, opacity: 0.55 },
  { x: 15, y: 3, opacity: 0.85 },
  { x: 3, y: 9, opacity: 0.45 },
  { x: 9, y: 9, opacity: 0.95 },
  { x: 15, y: 9, opacity: 0.35 },
  { x: 3, y: 15, opacity: 0.7 },
  { x: 9, y: 15, opacity: 0.4 },
  { x: 15, y: 15, opacity: 0.6 },
];

const HeatmapChartIcon = ({ className }: ChartIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {CELLS.map(cell => (
      <rect
        key={`${cell.x}-${cell.y}`}
        x={cell.x}
        y={cell.y}
        width="5"
        height="5"
        fill="currentColor"
        opacity={cell.opacity}
      />
    ))}
  </svg>
);

export { HeatmapChartIcon };
