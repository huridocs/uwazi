import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

type PageCountProps = {
  count: number;
  placement: 'top' | 'bottom';
  colors?: string[];
};

const PageCount = ({ count, placement, colors = [] }: PageCountProps) => {
  const Icon = placement === 'top' ? ArrowUpIcon : ArrowDownIcon;
  const seenColors: Record<string, number> = {};
  const dots = (
    <div className="flex items-center gap-0.5" data-testid="page-count-dots">
      {colors.map(color => {
        seenColors[color] = (seenColors[color] ?? 0) + 1;
        return (
          <span
            key={`${color}-${seenColors[color]}`}
            className="block h-1 w-1 rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );

  return (
    <div className="rounded-[3px] p-1 text-nano font-medium text-ink-secondary bg-(--color-theme-surface-warm) flex flex-col gap-0.5 items-center">
      {placement === 'top' && dots}
      <div className="flex flex-row gap-1 items-baseline">
        <Icon className="w-2 h-2" />
        {count}
      </div>
      {placement === 'bottom' && dots}
    </div>
  );
};

export { PageCount };
