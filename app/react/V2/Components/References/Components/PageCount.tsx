import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

type PageCountProps = {
  count: number;
  placement: 'top' | 'bottom';
};

const PageCount = ({ count, placement }: PageCountProps) => {
  const Icon = placement === 'top' ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="rounded p-1 text-[10px] font-medium text-ink-secondary bg-(--color-theme-surface-warm) flex flex-row gap-1 items-baseline">
      <Icon className="w-2 h-2" />
      {count}
    </div>
  );
};

export { PageCount };
