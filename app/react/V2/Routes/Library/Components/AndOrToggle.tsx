import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { FacetMode } from './FacetCard.js';

type AndOrToggleProps = {
  value: FacetMode;
  onChange: (mode: FacetMode) => void;
};

const modes: { id: FacetMode; translationKey: string; label: string }[] = [
  { id: 'and', translationKey: 'Filters AND operator', label: 'AND' },
  { id: 'or', translationKey: 'Filters OR operator', label: 'OR' },
];

const AndOrToggle = ({ value, onChange }: AndOrToggleProps) => (
  <div className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-warm p-0.5" role="group">
    {modes.map(mode => (
      <button
        key={mode.id}
        type="button"
        onClick={() => onChange(mode.id)}
        aria-pressed={value === mode.id}
        className={`h-5 cursor-pointer rounded px-2 text-meta font-bold tracking-wide transition-colors ${
          value === mode.id ? 'bg-vellum text-ink' : 'text-ink-tertiary hover:text-ink-secondary'
        }`}
      >
        <Translate translationKey={mode.translationKey}>{mode.label}</Translate>
      </button>
    ))}
  </div>
);

export type { AndOrToggleProps };
export { AndOrToggle };
