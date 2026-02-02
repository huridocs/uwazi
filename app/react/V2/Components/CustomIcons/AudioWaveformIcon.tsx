import React from 'react';
import { CustomIconProps } from './types.js';

const AudioWaveformIcon = ({ className, color = '#9ca3af' }: CustomIconProps) => {
  const bars = 60;
  const center = bars / 2;
  const maxHeight = 32;
  const barWidth = 2;
  const barGap = 1;
  const totalWidth = bars * (barWidth + barGap) - barGap;
  const startX = (200 - totalWidth) / 2;
  const centerY = 40;

  const generateBarHeights = () => {
    const seed = 12345;
    const seededRandom = (index: number) => {
      const x = Math.sin((index + seed) * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    return Array.from({ length: bars }, (_, i) => {
      const distanceFromCenter = Math.abs(i - center);
      const fadeFactor = 1 - Math.min(distanceFromCenter / center, 0.7);
      const baseHeight = seededRandom(i) * 0.4 * fadeFactor + 0.15;
      return baseHeight * maxHeight;
    });
  };

  const barHeights = generateBarHeights();

  return (
    <svg
      className={className || ''}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 80"
      fill="none"
    >
      {barHeights.map((height, index) => {
        const distanceFromCenter = Math.abs(index - center);
        const fadeFactor = 1 - Math.min(distanceFromCenter / center, 0.7);
        const opacity = 0.3 + fadeFactor * 0.5;
        const x = startX + index * (barWidth + barGap);
        const y = centerY - height / 2;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={height}
            fill={color}
            opacity={opacity}
            rx={1}
          />
        );
      })}
    </svg>
  );
};

export { AudioWaveformIcon };
