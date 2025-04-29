import React from 'react';

const getLighterShade = (hexValue: string, percent: number = 90): string => {
  if (!hexValue) return '';
  const hex = hexValue.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const factor = percent / 100;
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const DisplayPill = ({
  children,
  color = '#111928',
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) => {
  const bgColor = getLighterShade(color);
  const style = { backgroundColor: bgColor, color };
  return (
    <span
      className={`${className ?? 'px-2.5 rounded-md text-xs block'}`}
      style={style}
      data-testid="pill-comp"
    >
      {children}
    </span>
  );
};

export { DisplayPill };
