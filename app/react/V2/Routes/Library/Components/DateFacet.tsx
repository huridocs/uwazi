import React, { type ReactNode } from 'react';
import { FacetCard } from './FacetCard.js';

type DateFacetProps = {
  title: ReactNode;
  name: string;
  from?: number;
  to?: number;
  onChange: (range: { from?: number; to?: number }) => void;
  open?: boolean;
};

const toInputValue = (timestamp?: number) => {
  if (timestamp === undefined) {
    return '';
  }
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromInputValue = (value: string): number | undefined => {
  if (!value) {
    return undefined;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  return Date.UTC(year, month - 1, day);
};

const DateBox = ({
  id,
  value,
  onChange,
  ariaLabel,
}: {
  id: string;
  value?: number;
  onChange: (timestamp?: number) => void;
  ariaLabel: string;
}) => (
  <input
    id={id}
    type="date"
    value={toInputValue(value)}
    onChange={event => onChange(fromInputValue(event.target.value))}
    aria-label={ariaLabel}
    placeholder="dd/mm/yyyy"
    className="h-8 min-w-0 flex-1 cursor-pointer rounded-md border border-border bg-warm px-2 text-xs font-medium text-ink-secondary placeholder:text-ink-muted transition-all focus:border-carbon/40 focus:outline-none focus:ring-2 focus:ring-carbon/20 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
  />
);

const DateFacet = ({ title, name, from, to, onChange, open = true }: DateFacetProps) => (
  <FacetCard title={title} open={open} stacked>
    <div className="flex items-center gap-1.5 px-1">
      <DateBox
        id={`facet-${name}-from`}
        value={from}
        onChange={timestamp => onChange({ from: timestamp, to })}
        ariaLabel="From date"
      />
      <span className="shrink-0 text-xs text-ink-tertiary" aria-hidden>
        →
      </span>
      <DateBox
        id={`facet-${name}-to`}
        value={to}
        onChange={timestamp => onChange({ from, to: timestamp })}
        ariaLabel="To date"
      />
    </div>
  </FacetCard>
);

export type { DateFacetProps };
export { DateFacet, fromInputValue, toInputValue };
