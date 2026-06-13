import React, { useRef } from 'react';
import { Checkbox } from '#V2/Components/Forms/Checkbox.js';

type ThemeColorsSectionProps = {
  background?: string;
  foreground?: string;
  onChange: (patch: { background?: string; foreground?: string }) => void;
};

const ThemeColorsSection = ({ background, foreground, onChange }: ThemeColorsSectionProps) => {
  const lastSolidBackground = useRef('#ffffff');
  const isTransparent = background === 'transparent';

  const handleTransparentChange = (checked: boolean) => {
    if (checked) {
      if (background && background !== 'transparent') {
        lastSolidBackground.current = background;
      }
      onChange({ background: 'transparent' });
      return;
    }
    onChange({ background: lastSolidBackground.current });
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">Chart theme</h3>
      <Checkbox
        name="transparent-background"
        label="Transparent background"
        checked={isTransparent}
        onChange={e => handleTransparentChange((e.target as HTMLInputElement).checked)}
      />
      <label className="flex flex-col gap-1 text-sm text-ink-secondary">
        Background
        <input
          id="bg-color"
          type="color"
          value={isTransparent ? lastSolidBackground.current : background || '#ffffff'}
          disabled={isTransparent}
          onChange={e => {
            lastSolidBackground.current = e.target.value;
            onChange({ background: e.target.value });
          }}
          className="h-8 w-full cursor-pointer rounded border border-border disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-secondary">
        Foreground
        <input
          id="fg-color"
          type="color"
          value={foreground || '#1a1a1a'}
          onChange={e => onChange({ foreground: e.target.value })}
          className="h-8 w-full cursor-pointer rounded border border-border"
        />
      </label>
    </section>
  );
};

export { ThemeColorsSection };
