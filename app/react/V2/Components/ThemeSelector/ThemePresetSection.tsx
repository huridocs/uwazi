import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ACCENT_PRIMARY_KEY, appliedTheme, NAMED_THEMES } from '#V2/theme/themes.js';
import type { ThemeMode } from '#V2/theme/themes.js';

type ThemeVars = Record<string, string | undefined>;

type ThemePresetSectionProps = {
  themeVars: ThemeVars;
  selectedPreset: string;
  onSelectPreset: (themeId: (typeof NAMED_THEMES)[number]['id']) => void;
};

type PresetCardProps = {
  title: string;
  lightAccent: string;
  darkAccent: string;
  selected: boolean;
  onClick: () => void;
};

const previewPaneClassName = 'space-y-2 p-2';
const previewButtonClassName = 'h-8 rounded-md border';

const previewPaneStyle = (mode: ThemeMode): React.CSSProperties => ({
  backgroundColor: mode === 'light' ? '#ffffff' : '#242424',
});

const PresetCard = ({ title, lightAccent, darkAccent, selected, onClick }: PresetCardProps) => (
  <button
    type="button"
    className={`flex min-w-[10rem] flex-1 flex-col gap-3 rounded-xl border p-3 text-left transition-all ${
      selected ? 'border-primary-600 ring-2 ring-primary-500/20' : 'hover:border-gray-300'
    }`}
    style={{
      borderColor: selected
        ? undefined
        : 'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
      color: 'var(--color-theme-text-primary)',
    }}
    onClick={onClick}
  >
    <div
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
      }}
    >
      <div className="grid grid-cols-2">
        <div className={previewPaneClassName} style={previewPaneStyle('light')}>
          <div className="h-2 w-12 rounded-sm bg-black/20" />
          <div
            className={previewButtonClassName}
            style={{ borderColor: lightAccent, backgroundColor: '#ffffff' }}
          />
          <div className="h-6 rounded-md" style={{ backgroundColor: lightAccent }} />
        </div>
        <div className={previewPaneClassName} style={previewPaneStyle('dark')}>
          <div className="h-2 w-12 rounded-sm bg-white/20" />
          <div
            className={previewButtonClassName}
            style={{ borderColor: darkAccent, backgroundColor: '#242424' }}
          />
          <div className="h-6 rounded-md" style={{ backgroundColor: darkAccent }} />
        </div>
      </div>
    </div>
    <div className="text-sm font-medium">{title}</div>
  </button>
);

const ThemePresetSection = ({
  themeVars,
  selectedPreset,
  onSelectPreset,
}: ThemePresetSectionProps) => (
  <section>
    <label className="mb-2 block text-sm font-medium text-ink-secondary">
      <Translate>Theme presets</Translate>
    </label>
    <div className="grid gap-3 md:grid-cols-3">
      {NAMED_THEMES.map(theme => {
        const lightAccent =
          theme.id === 'custom'
            ? appliedTheme(themeVars, 'light', true)[ACCENT_PRIMARY_KEY]
            : theme.modes.light[ACCENT_PRIMARY_KEY];
        const darkAccent =
          theme.id === 'custom'
            ? appliedTheme(themeVars, 'dark', true)[ACCENT_PRIMARY_KEY]
            : theme.modes.dark[ACCENT_PRIMARY_KEY];

        return (
          <PresetCard
            key={theme.id}
            title={theme.label}
            lightAccent={lightAccent}
            darkAccent={darkAccent}
            selected={selectedPreset === theme.id}
            onClick={() => onSelectPreset(theme.id)}
          />
        );
      })}
    </div>
  </section>
);

export { ThemePresetSection };
