import React from 'react';
import type { DataPoint } from '#V2/Dataviz/types/data.js';

type FromDataColorHintProps = {
  previewPoints?: DataPoint[];
};

const FromDataColorHint = ({ previewPoints }: FromDataColorHintProps) => (
  <div className="rounded-lg bg-vellum p-3 text-xs text-ink-secondary">
    <p>Colors come from the server data layer. Preview shows assigned bucket colors when available.</p>
    {previewPoints && previewPoints.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-2">
        {previewPoints.slice(0, 8).map(point => (
          <span key={String(point.key)} className="flex items-center gap-1">
            <span
              className="h-3 w-3 rounded-full border border-border"
              style={{ backgroundColor: point.color || '#ccc' }}
            />
            {point.label}
          </span>
        ))}
      </div>
    )}
  </div>
);

export { FromDataColorHint };
