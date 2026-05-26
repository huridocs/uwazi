import React from 'react';

type PageLabelProps = {
  page: number;
};

const PageLabel = ({ page }: PageLabelProps) => (
  <div className="flex items-center gap-1">
    <div className="h-px w-3 bg-(--color-theme-border-default)" />
    <span className="whitespace-nowrap rounded bg-(--color-theme-surface-warm) p-1 text-[10px]">
      p. {page}
    </span>
    <div className="h-px w-3 bg-(--color-theme-border-default)" />
  </div>
);

export { PageLabel };
