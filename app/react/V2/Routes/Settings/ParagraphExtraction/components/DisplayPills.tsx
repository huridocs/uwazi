import React from 'react';

// eslint-disable-next-line max-statements
const adjustShade = (hexValue: string, percent: number, lighten: boolean): string => {
  if (!hexValue) return '';
  const hex = hexValue.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const factor = percent / 100;

  const adjust = (channel: number) =>
    lighten ? Math.round(channel + (255 - channel) * factor) : Math.round(channel * (1 - factor));

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const getDarkerShade = (hexValue: string, percent: number = 60): string =>
  adjustShade(hexValue, percent, false);

const getLighterShade = (hexValue: string, percent: number = 60): string =>
  adjustShade(hexValue, percent, true);

const DisplayPill = ({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) => {
  const bgColor = color ? getLighterShade(color) : '#f3f4f6';
  const textColor = color ? getDarkerShade(color) : '#111827';
  const style = { backgroundColor: bgColor, color: textColor };
  return (
    <span
      className={`${className ?? 'py-1 px-2.5 rounded-md text-xs block font-medium'}`}
      style={style}
      data-testid="pill-comp"
    >
      {children}
    </span>
  );
};

export { DisplayPill };
