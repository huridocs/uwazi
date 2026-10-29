import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { TypeFilterScope } from '../libraryTypeFilters.js';

type TypeScopeToggleProps = {
  value: TypeFilterScope;
  onChange: (scope: TypeFilterScope) => void;
};

const typeScopes: { id: TypeFilterScope; label: string }[] = [
  { id: 'featured', label: 'FEATURED' },
  { id: 'all', label: 'ALL' },
];

const TypeScopeToggle = ({ value, onChange }: TypeScopeToggleProps) => (
  <div className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-warm p-0.5" role="group">
    {typeScopes.map(scope => (
      <button
        key={scope.id}
        type="button"
        onClick={() => onChange(scope.id)}
        aria-pressed={value === scope.id}
        className={`h-5 cursor-pointer rounded px-2 text-meta font-bold tracking-wide transition-colors ${
          value === scope.id ? 'bg-vellum text-ink' : 'text-ink-tertiary hover:text-ink-secondary'
        }`}
      >
        <Translate>{scope.label}</Translate>
      </button>
    ))}
  </div>
);

export type { TypeScopeToggleProps };
export { TypeScopeToggle };
