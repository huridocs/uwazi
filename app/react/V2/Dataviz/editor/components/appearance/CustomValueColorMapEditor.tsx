import React from 'react';
import type { DataPoint } from '#V2/Dataviz/types/data.js';

type CustomValueColorMapEditorProps = {
  previewPoints?: DataPoint[];
  valueColorMap: Record<string, string>;
  onChange: (map: Record<string, string>) => void;
};

const CustomValueColorMapEditor = ({
  previewPoints = [],
  valueColorMap,
  onChange,
}: CustomValueColorMapEditorProps) => {
  if (previewPoints.length === 0) {
    return (
      <p className="text-xs text-ink-secondary">
        Load a preview to map colors to bucket values.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {previewPoints.map(point => {
        const key = String(point.key);
        return (
          <label
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2"
          >
            <span className="text-sm text-ink">{point.label}</span>
            <input
              type="color"
              value={valueColorMap[key] || point.color || '#4A90D9'}
              onChange={e =>
                onChange({ ...valueColorMap, [key]: e.target.value })
              }
              className="h-8 w-12 cursor-pointer rounded border border-border"
            />
          </label>
        );
      })}
    </div>
  );
};

export { CustomValueColorMapEditor };
