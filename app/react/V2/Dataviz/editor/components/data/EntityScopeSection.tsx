import React from 'react';
import { Translate } from '#app/I18N/index.js';

type EntityScopeSectionProps = {
  includeUnpublished: boolean;
  onChange: (includeUnpublished: boolean) => void;
};

const ENTITY_SCOPE_OPTIONS: {
  value: boolean;
  label: string;
  description: string;
}[] = [
  {
    value: true,
    label: 'Include all entities',
    description: 'Published and unpublished entities are counted.',
  },
  {
    value: false,
    label: 'Include only public',
    description: 'Only published entities are counted.',
  },
];

const EntityScopeSection = ({ includeUnpublished, onChange }: EntityScopeSectionProps) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-sm font-semibold text-ink">
      <Translate>Entity scope</Translate>
    </h3>
    <div className="flex gap-3">
      {ENTITY_SCOPE_OPTIONS.map(option => {
        const isSelected = includeUnpublished === option.value;

        return (
          <label
            key={String(option.value)}
            className={`flex min-w-0 flex-1 cursor-pointer flex-col gap-3 rounded-lg border p-3 ${
              isSelected ? 'border-ink bg-warm' : 'border-border'
            }`}
          >
            <span className="flex gap-3">
              <input
                type="radio"
                name="entity-scope"
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="mt-1 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">
                  <Translate>{option.label}</Translate>
                </span>
                <span className="mt-0.5 block text-xs text-ink-secondary">
                  <Translate>{option.description}</Translate>
                </span>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  </section>
);

export { EntityScopeSection };
