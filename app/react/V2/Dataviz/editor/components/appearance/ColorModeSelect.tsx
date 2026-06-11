import React from 'react';
import { Select } from '#V2/Components/Forms/Select.js';
import type { ColorMode } from '#V2/Dataviz/types/definition.js';

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string; hint: string }[] = [
  {
    value: 'from_data',
    label: 'From server data (default)',
    hint: 'Uses colors from the data response (backend assigns per bucket). Thesaurus values have no color.',
  },
  {
    value: 'theme',
    label: 'Theme palette',
    hint: 'Sequential colors from the collection theme.',
  },
  {
    value: 'template',
    label: 'Template colors',
    hint: 'Use each template brand color — only for entity-type / multi-source dimensions.',
  },
  {
    value: 'custom',
    label: 'Custom per value',
    hint: 'Override colors for specific bucket values below.',
  },
];

type ColorModeSelectProps = {
  value: ColorMode;
  onChange: (mode: ColorMode) => void;
};

const ColorModeSelect = ({ value, onChange }: ColorModeSelectProps) => {
  const selected = COLOR_MODE_OPTIONS.find(o => o.value === value);

  return (
    <div className="flex flex-col gap-2">
      <Select
        id="color-mode"
        label="Color mode"
        value={value}
        options={COLOR_MODE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        onChange={e => onChange(e.target.value as ColorMode)}
      />
      {selected && <p className="text-xs text-ink-secondary">{selected.hint}</p>}
    </div>
  );
};

export { ColorModeSelect };
