import React from 'react';
import type { CustomColorTarget, CustomColorTargetKind } from '#V2/Dataviz/utils/getCustomColorTargets.js';

const EMPTY_MESSAGES: Partial<Record<CustomColorTargetKind, string>> = {
  series: 'Load a preview to map colors to each data series.',
  bucket: 'Load a preview to map colors to each category or slice.',
  stacked_series: 'Load a preview to map colors to each stack segment.',
};

type CustomValueColorMapEditorProps = {
  targets?: CustomColorTarget[];
  targetKind: CustomColorTargetKind;
  valueColorMap: Record<string, string>;
  onChange: (map: Record<string, string>) => void;
};

const CustomValueColorMapEditor = ({
  targets = [],
  targetKind,
  valueColorMap,
  onChange,
}: CustomValueColorMapEditorProps) => {
  if (targets.length === 0) {
    return (
      <p className="text-xs text-ink-secondary">
        {EMPTY_MESSAGES[targetKind] ?? 'Load a preview to customize colors.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {targets.map(target => (
        <label
          key={target.key}
          className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2"
        >
          <span className="text-sm text-ink">{target.label}</span>
          <input
            type="color"
            value={valueColorMap[target.key] || target.defaultColor || '#4A90D9'}
            onChange={e => onChange({ ...valueColorMap, [target.key]: e.target.value })}
            className="h-8 w-12 cursor-pointer rounded border border-border"
          />
        </label>
      ))}
    </div>
  );
};

export { CustomValueColorMapEditor };
