import React from 'react';

type PageLabelProps = {
  page: number;
  markerLayerHeight: number;
};

const PageLabel = ({ page, markerLayerHeight }: PageLabelProps) => (
  <div
    className="absolute flex -translate-y-1/2 items-center gap-1.5"
    style={{ top: markerLayerHeight > 0 ? markerLayerHeight * 0.18 : 36 }}
  >
    <div className="h-px w-3.5 bg-(--color-theme-border-default)" />
    <span
      no-translate="true"
      data-testid="page-mode-label"
      className="whitespace-nowrap rounded bg-(--color-theme-surface-warm) px-1 py-0.5 text-[9px] font-medium"
    >
      p. {page}
    </span>
    <div className="h-px w-3.5 bg-(--color-theme-border-default)" />
  </div>
);

export { PageLabel };
