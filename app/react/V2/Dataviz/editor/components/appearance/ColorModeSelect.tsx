import React, { useMemo } from 'react';
import { Select } from '#V2/Components/Forms/Select.js';
import type { ColorMode } from '#V2/Dataviz/types/definition.js';
import {
  CUSTOM_COLOR_TARGET_HINTS,
  type CustomColorTargetKind,
} from '#V2/Dataviz/utils/getCustomColorTargets.js';

const BASE_COLOR_MODE_OPTIONS: { value: ColorMode; label: string; hint: string }[] = [
  {
    value: 'theme',
    label: 'Chart palette',
    hint: 'Assigns colors in order from a fixed palette. Repeats when there are more values than colors.',
  },
  {
    value: 'template',
    label: 'Template colors',
    hint: 'Uses each template brand color when comparing data sources or when the dimension is entity type.',
  },
  {
    value: 'custom',
    label: 'Custom colors',
    hint: 'Override colors for specific values below.',
  },
];

type ColorModeSelectProps = {
  value: ColorMode;
  supportsCustomColors: boolean;
  supportsTemplateColors?: boolean;
  customTargetKind?: CustomColorTargetKind;
  onChange: (mode: ColorMode) => void;
};

const ColorModeSelect = ({
  value,
  supportsCustomColors,
  supportsTemplateColors = true,
  customTargetKind = 'bucket',
  onChange,
}: ColorModeSelectProps) => {
  const normalizedValue = value === 'from_data' ? 'theme' : value;
  const options = useMemo(
    () =>
      BASE_COLOR_MODE_OPTIONS.filter(option => {
        if (option.value === 'custom') {
          return supportsCustomColors;
        }
        if (option.value === 'template') {
          return supportsTemplateColors;
        }
        return true;
      }),
    [supportsCustomColors, supportsTemplateColors]
  );
  const effectiveValue = options.some(option => option.value === normalizedValue)
    ? normalizedValue
    : 'theme';
  const selected = options.find(option => option.value === effectiveValue);
  const customHint =
    customTargetKind !== 'none' ? CUSTOM_COLOR_TARGET_HINTS[customTargetKind] : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Select
        id="color-mode"
        label="Color mode"
        value={effectiveValue}
        options={options.map(option => ({ value: option.value, label: option.label }))}
        onChange={e => onChange(e.target.value as ColorMode)}
      />
      {selected && (
        <p className="text-xs text-ink-secondary">
          {selected.value === 'custom' && customHint ? customHint : selected.hint}
        </p>
      )}
    </div>
  );
};

export { ColorModeSelect };
