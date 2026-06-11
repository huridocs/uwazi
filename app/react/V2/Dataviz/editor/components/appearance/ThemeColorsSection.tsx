import React from 'react';

type ThemeColorsSectionProps = {
  background?: string;
  foreground?: string;
  onChange: (patch: { background?: string; foreground?: string }) => void;
};

const ThemeColorsSection = ({ background, foreground, onChange }: ThemeColorsSectionProps) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-sm font-semibold text-ink">Chart theme</h3>
    <label className="flex flex-col gap-1 text-sm text-ink-secondary">
      Background
      <input
        id="bg-color"
        type="color"
        value={background || '#ffffff'}
        onChange={e => onChange({ background: e.target.value })}
        className="h-8 w-full cursor-pointer rounded border border-border"
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

export { ThemeColorsSection };
