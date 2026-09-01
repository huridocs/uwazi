import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { FacetCard } from './FacetCard.js';

type TextFacetProps = {
  title: ReactNode;
  name: string;
  value: string;
  onChange: (value: string) => void;
  open?: boolean;
};

const TextFacet = ({ title, name, value, onChange, open = true }: TextFacetProps) => (
  <FacetCard title={title} open={open} stacked>
    <div className="px-1">
      <InputField
        id={`facet-${name}`}
        hideLabel
        label={title}
        value={value}
        placeholder="Search"
        onChange={event => onChange(event.target.value)}
        clearFieldAction={value ? () => onChange('') : undefined}
      />
    </div>
    {value ? (
      <p className="px-2 pb-1 text-xs text-ink-tertiary">
        <Translate>Contains</Translate>: {value}
      </p>
    ) : null}
  </FacetCard>
);

export type { TextFacetProps };
export { TextFacet };
