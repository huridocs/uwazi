import React from 'react';
import { Translate } from '#app/I18N/index.js';

type EntityScopeSectionProps = {
  includeUnpublished: boolean;
  onChange: (includeUnpublished: boolean) => void;
};

const optionClass = (selected: boolean) =>
  `flex min-w-0 flex-1 cursor-pointer flex-col gap-3 rounded-lg border p-3 ${
    selected ? 'border-ink bg-warm' : 'border-border'
  }`;

const EntityScopeSection = ({ includeUnpublished, onChange }: EntityScopeSectionProps) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-sm font-semibold text-ink">
      <Translate>Entity scope</Translate>
    </h3>
    <div className="flex gap-3">
      <label className={optionClass(includeUnpublished === true)}>
        <span className="flex gap-3">
          <input
            type="radio"
            name="entity-scope"
            checked={includeUnpublished === true}
            onChange={() => onChange(true)}
            className="mt-1 shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">
              <Translate>Include all entities</Translate>
            </span>
            <span className="mt-0.5 block text-xs text-ink-secondary">
              <Translate>Published and unpublished entities are counted.</Translate>
            </span>
          </span>
        </span>
      </label>

      <label className={optionClass(includeUnpublished === false)}>
        <span className="flex gap-3">
          <input
            type="radio"
            name="entity-scope"
            checked={includeUnpublished === false}
            onChange={() => onChange(false)}
            className="mt-1 shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">
              <Translate>Include only public</Translate>
            </span>
            <span className="mt-0.5 block text-xs text-ink-secondary">
              <Translate>Only published entities are counted.</Translate>
            </span>
          </span>
        </span>
      </label>
    </div>
  </section>
);

export { EntityScopeSection };
