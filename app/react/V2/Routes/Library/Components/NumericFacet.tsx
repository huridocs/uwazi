import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { FacetCard } from './FacetCard.js';

type NumericFacetProps = {
  title: ReactNode;
  name: string;
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  open?: boolean;
};

const NumericFacet = ({ title, name, from, to, onChange, open = true }: NumericFacetProps) => (
  <FacetCard title={title} open={open} stacked>
    <div className="grid grid-cols-2 gap-2 px-1">
      <InputField
        id={`facet-${name}-from`}
        type="number"
        label={<Translate>From</Translate>}
        value={from}
        onChange={event => onChange({ from: event.target.value, to })}
        clearFieldAction={from ? () => onChange({ from: '', to }) : undefined}
      />
      <InputField
        id={`facet-${name}-to`}
        type="number"
        label={<Translate>To</Translate>}
        value={to}
        onChange={event => onChange({ from, to: event.target.value })}
        clearFieldAction={to ? () => onChange({ from, to: '' }) : undefined}
      />
    </div>
  </FacetCard>
);

export type { NumericFacetProps };
export { NumericFacet };
