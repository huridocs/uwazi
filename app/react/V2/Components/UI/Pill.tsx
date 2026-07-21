import React from 'react';

type PillColor = 'primary' | 'gray' | 'yellow' | 'green' | 'blue' | 'red' | 'indigo';
interface PillProps {
  children: string | React.ReactNode;
  color?: PillColor;
  className?: string;
}

const Pill = ({ children, color, className }: PillProps) => {
  let pillColors = '';

  switch (color) {
    case 'gray':
      pillColors = 'bg-(--color-theme-surface-warm) text-ink-secondary';
      break;

    case 'yellow':
      pillColors = 'bg-yellow-100 text-yellow-800';
      break;
    case 'green':
      pillColors = 'bg-green-100 text-green-800';
      break;
    case 'blue':
      pillColors = 'bg-blue-100 text-blue-800';
      break;
    case 'red':
      pillColors = 'bg-red-100 text-red-800';
      break;
    case 'indigo':
      pillColors = 'bg-primary-100 text-indigo-800';
      break;

    default:
      pillColors = 'bg-(--color-theme-surface-muted) text-ink-secondary';
      break;
  }
  return (
    <span
      className={[className, pillColors, 'px-1.5 py-1 rounded-md text-xs font-semibold']
        .filter(Boolean)
        .join(' ')}
      data-testid="pill-comp"
    >
      {children}
    </span>
  );
};

export type { PillColor };
export { Pill };
