import React from 'react';
import { Translate, t } from '#app/I18N/index.js';

type ZoomControlsProps = {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

const RelationshipsGraphZoomControls = ({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) => (
  <div className="absolute bottom-1 right-3 z-10 flex items-center gap-1 rounded-md border border-border bg-paper px-1 py-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
    <button
      type="button"
      aria-label={t('System', 'Zoom out', null, false)}
      onClick={onZoomOut}
      className="flex h-6 w-6 items-center justify-center rounded text-sm text-ink hover:bg-gray-100"
    >
      −
    </button>
    <span className="min-w-[3.5ch] text-center text-tab font-medium text-ink-secondary">
      {Math.round(scale * 100)}%
    </span>
    <button
      type="button"
      aria-label={t('System', 'Zoom in', null, false)}
      onClick={onZoomIn}
      className="flex h-6 w-6 items-center justify-center rounded text-sm text-ink hover:bg-gray-100"
    >
      +
    </button>
    <button type="button" onClick={onReset} className="ml-1 text-xs text-ink-light hover:text-ink">
      <Translate>Reset</Translate>
    </button>
  </div>
);

export { RelationshipsGraphZoomControls };
