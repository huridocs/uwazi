import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { useDebouncedDraft } from '#V2/CustomHooks/useDebouncedDraft.js';
import { FacetCard } from './FacetCard.js';

type TextFacetProps = {
  title: ReactNode;
  name: string;
  value: string;
  onChange: (value: string) => void;
  open?: boolean;
};

const TextFacet = ({ title, name, value, onChange, open = true }: TextFacetProps) => {
  const commit = (next: string) => {
    const trimmed = next.trim();
    if (trimmed === value) {
      return;
    }
    onChange(trimmed);
  };
  const { draft, setDraft, commitNow } = useDebouncedDraft(value, commit, {
    shouldCommitImmediately: next => next.trim() === '',
  });

  return (
    <FacetCard title={title} open={open} stacked>
      <div className="px-1">
        <InputField
          id={`facet-${name}`}
          hideLabel
          label={title}
          value={draft}
          placeholder="Search"
          onChange={event => setDraft(event.target.value)}
          clearFieldAction={draft ? () => commitNow('') : undefined}
        />
      </div>
      {draft ? (
        <p className="px-2 pb-1 text-xs text-ink-tertiary">
          <Translate>Contains</Translate>: {draft}
        </p>
      ) : null}
    </FacetCard>
  );
};

export type { TextFacetProps };
export { TextFacet };
