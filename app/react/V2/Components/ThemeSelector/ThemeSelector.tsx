import React from 'react';
import { Translate } from '#app/I18N/index.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getPresetVars,
  isValidHex,
  NAMED_THEMES,
  normalizeHex,
  SEMANTIC_VAR_KEYS,
  SEMANTIC_VAR_LABELS,
} from '#V2/theme/themes.js';

export interface ThemeSelectorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export const ThemeSelector = ({ value, onChange }: ThemeSelectorProps) => {
  const themeVars = value ?? {};
  const resolved = appliedTheme(themeVars);

  const update = (key: string, hex: string | undefined) => {
    const next = { ...themeVars };
    if (hex === undefined || hex === '') delete next[key];
    else next[key] = hex;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Translate>Theme presets</Translate>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          <Translate>Load preset as starting values. Edit colors below to customize.</Translate>
        </p>
        <div className="flex flex-wrap gap-3">
          {NAMED_THEMES.map(theme => {
            const accent = theme.semanticVars[ACCENT_PRIMARY_KEY];
            return (
              <button
                key={theme.id}
                type="button"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-gray-200 p-3 transition-all min-w-[100px] hover:border-gray-300"
                onClick={() => onChange(getPresetVars(theme.id))}
              >
                <span className="h-8 w-full rounded" style={{ backgroundColor: accent }} />
                <span className="text-sm font-medium text-gray-700">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Translate>Theme variables</Translate>
        </label>
        <div className="grid gap-2 max-w-xl">
          {SEMANTIC_VAR_KEYS.map(key => {
            const displayValue = themeVars[key] ?? resolved[key] ?? '#000000';
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-40 text-xs text-gray-600">
                  {SEMANTIC_VAR_LABELS[key] ?? key}
                </span>
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border border-gray-200 bg-transparent p-0"
                  value={displayValue.slice(0, 7)}
                  onChange={e => update(key, e.target.value)}
                  aria-label={SEMANTIC_VAR_LABELS[key]}
                />
                <input
                  type="text"
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                  value={themeVars[key] ?? ''}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      update(key, undefined);
                      return;
                    }
                    const hex = normalizeHex(raw);
                    if (hex.length === 7 && isValidHex(hex)) update(key, hex);
                  }}
                  aria-label={`${SEMANTIC_VAR_LABELS[key]} hex`}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
