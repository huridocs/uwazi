import React from 'react';

interface FilterPillProps {
  active: boolean;
  label: React.ReactNode;
  count: number;
  onClick: () => void;
}

const FilterPill = ({ active, label, count, onClick }: FilterPillProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors ${
      active ? 'bg-vellum text-ink' : 'text-ink-secondary hover:bg-warm'
    }`}
  >
    {label}
    <span className={`text-[11px] tabular-nums ${active ? 'text-ink-tertiary' : 'text-ink-muted'}`}>
      {count}
    </span>
  </button>
);

export { FilterPill };
