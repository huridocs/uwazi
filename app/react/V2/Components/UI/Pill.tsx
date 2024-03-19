import React from 'react';

type PillColor = 'primary' | 'gray' | 'yellow' | 'green' | 'blue' | 'red';
interface PillProps {
  children: string | React.ReactNode;
  color: PillColor;
  className?: string;
}

const Pill = ({ children, color = 'gray', className }: PillProps) => {
  let pillColors = '';

  switch (color) {
    case 'gray':
      pillColors = 'bg-gray-100';
      break;

    case 'yellow':
    case 'green':
    case 'blue':
    case 'red':
      pillColors = `bg-${color}-100 text-${color}-800`;
      break;

    default:
      pillColors = 'bg-primary-100 text-primary-800';
      break;
  }
  return (
    <span
      className={`${className} px-2.5 py-1 rounded-md text-xs ${pillColors}`}
      data-testid="pill-comp"
    >
      {children}
    </span>
  );
};

export type { PillColor };
export { Pill };
