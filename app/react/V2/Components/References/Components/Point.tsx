import React from 'react';

type PointProps = {
  position: number;
  color: string;
};

const Point = ({ position, color }: PointProps) => (
  <span
    className="absolute block h-2.5 w-2.5 rounded-full"
    style={{ backgroundColor: color, top: `${position}px` }}
  />
);

export { Point };
